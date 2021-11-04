import './manifest.json'
//import 'file-loader?name=[name].[ext]!./icon128.png'
import {callJsonRpc, addJsonRpcListener} from './messaging'
import {chromePromisify} from '../util'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

if (!self.chrome && self.browser) {
  self.chrome = self.browser;
}

var registeredTabs = {}
function contentPageEvent(evt, tabId){
    if(!registeredTabs[tabId]) return; //if the tab is not registered... ignore the event
    registeredTabs[tabId].events.push(evt)
}
addJsonRpcListener('contentPageEvent', contentPageEvent)

async function postToIngest(pageUrl, dataType, data, keyPrefix) {
    // B2
    const REGION = "us-west-000"
    const BUCKET = ""
    const ACCESS_KEY_ID = ""
    const SECRET_ACCESS_KEY = ""
    const S3_ENDPOINT = "https://s3.us-west-000.backblazeb2.com"

    const key = `${keyPrefix}/capture.${dataType}`
    const contentType = {
        html: "text/html",
        jpg: "image/jpeg",
        mhtml: "multipart/related",
        url: "text/plain",
    }[dataType]

    console.log("PUTing to key", key)
    try {
        const s3 = new S3Client({
            region: REGION,
            credentials: {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
            },
            endpoint: S3_ENDPOINT,
        })

        const res = await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
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
    return new Promise((resolve, reject)=>{
        try {
            const reader = new FileReader()
            reader.onload = function() {
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

  for(var i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}


async function capturePage(url, dom, tabId) {
    const windowId = (await chromePromisify(chrome.tabs.get)(tabId)).windowId

    let screenshotDataUrl;
    try {
        screenshotDataUrl = await chromePromisify(chrome.tabs.captureVisibleTab)(windowId)
    } catch (e) {
        console.error("screenshot error", e)
        screenshotDataUrl = null;
    }

    let mhtml;
    try {
        mhtml = await chromePromisify(chrome.pageCapture.saveAsMHTML)({tabId})
    } catch (e) {
        console.error("mhtml error", e)
        mhtml = null;
    }

    const keyPrefix = `${(new Date()).toISOString()}/${(new URL(url)).host}`

    const imgBytes = convertDataURIToBinary(screenshotDataUrl)
    await Promise.all([
        postToIngest(url, 'url', url, keyPrefix),
        postToIngest(url, 'html', dom, keyPrefix),
        mhtml ? postToIngest(url, 'mhtml', await blobToString(mhtml), keyPrefix) : Promise.resolve(),
        imgBytes ? await postToIngest(url, 'jpg', imgBytes, keyPrefix) : Promise.resolve(),
    ])
}
addJsonRpcListener('capturePage', function() {
  capturePage(...arguments).then()  // firefox nonsense
})
