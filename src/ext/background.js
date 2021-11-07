import 'file-loader?name=[name].[ext]!./icon128.png'
import 'file-loader?name=[name].[ext]!./icon128-inactive.png'
import { callJsonRpc, addJsonRpcListener } from './messaging'
import { chromePromisify, getSettings, parseS3Endpoint } from '../util'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

if (!self.chrome && self.browser) {
    self.chrome = self.browser;
}

var registeredTabs = {}
function contentPageEvent(evt, tabId) {
    if (!registeredTabs[tabId]) return; //if the tab is not registered... ignore the event
    registeredTabs[tabId].events.push(evt)
}
addJsonRpcListener('contentPageEvent', contentPageEvent)

async function postToIngest(pageUrl, dataType, data, keyPrefix) {

    const { s3Endpoint: url, accessKeyId, secretAccessKey } = await getSettings();
    const { region, endpoint, bucket, prefix: globalPrefix } = parseS3Endpoint(url);
    const key = `${globalPrefix ? globalPrefix + "/" : ""}${keyPrefix}/capture.${dataType}`
    const contentType = {
        html: "text/html",
        jpg: "image/jpeg",
        mhtml: "multipart/related",
        url: "text/plain",
    }[dataType]

    console.log("PUTing to", `${endpoint}/${key}`)
    try {
        const s3 = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
            endpoint,
        })

        const res = await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: data,
            ContentType: contentType,
        }))
        //console.log("s3 result", res)
    } catch (e) {
        console.error("s3 error", e)
    }
}

function blobToString(blob) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader()
            reader.onload = function () {
                resolve(reader.result)
            }
            reader.readAsText(blob)
        } catch (e) {
            reject(e)
        }
    })
}

var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
    if (!dataURI) return dataURI;
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

var totalCaptures = 0;
async function capturePage(url, dom, tabId) {
    const windowId = (await chromePromisify(chrome.tabs.get)(tabId)).windowId

    //do data capture
    let screenshotDataUrl;
    try {
        screenshotDataUrl = await chromePromisify(chrome.tabs.captureVisibleTab)(windowId)
    } catch (e) {
        console.error("screenshot error", e)
        screenshotDataUrl = null;
    }
    let mhtml;
    try {
        mhtml = await chromePromisify(chrome.pageCapture.saveAsMHTML)({ tabId })
    } catch (e) {
        console.error("mhtml error", e)
        mhtml = null;
    }

    //update badge count
    totalCaptures++;
    await refreshIconStatus();

    //do actual save
    const keyPrefix = `${(new Date()).toISOString()}/${(new URL(url)).host}`
    const imgBytes = convertDataURIToBinary(screenshotDataUrl)
    await Promise.all([
        postToIngest(url, 'url', url, keyPrefix),
        postToIngest(url, 'html', dom, keyPrefix),
        mhtml ? postToIngest(url, 'mhtml', await blobToString(mhtml), keyPrefix) : Promise.resolve(),
        imgBytes ? await postToIngest(url, 'jpg', imgBytes, keyPrefix) : Promise.resolve(),
    ])
}
addJsonRpcListener('capturePage', function () {
    capturePage(...arguments).then()  // firefox nonsense
})

async function refreshIconStatus() {
    const { disabled } = await getSettings();
    chrome.browserAction.setIcon({ path: `icon128${disabled ? "-inactive" : ""}.png` });
    if(disabled) chrome.browserAction.setBadgeText({ text: "" });
    else chrome.browserAction.setBadgeText({ text: "" + totalCaptures });
}
addJsonRpcListener('refreshIconStatus', refreshIconStatus)
refreshIconStatus();