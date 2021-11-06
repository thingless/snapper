export function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
}

export function setSettings(settings){
  return new Promise((resolve)=>{
    chrome.storage.local.set(settings, resolve)
  })
}

export function getSettings(){
  return new Promise((resolve)=>{
    chrome.storage.local.get(['s3Endpoint','accessKeyId','secretAccessKey'], resolve)
  })
}

export const chromePromisify  = (fn) => (
  (...args) => (
    new Promise((resolve, reject) => {
      try {
        fn(...args, (...res) => {
          resolve(...res)
        })
      } catch (e) {
        reject(e)
      }
    })
  )
)

export const promisify = (fn) => (
  (...args) => (
    new Promise((resolve, reject) => {
      fn(...args, (err, ...res) => {
        if (err) reject(err)
        else resolve(...res)
      })
    })
  )
)

export function parseS3Endpoint(url) {
  try {
      url = new URL(url);
  } catch (error) {
      throw new Error("URL can not be parsed.")
  }
  if(url.protocol != "http:" && url.protocol != "https:"){
      throw new Error("Protocol must be http or https.")
  }
  const bucket = url.pathname.split("/").filter(i=>i)[0]
  if(!bucket){
      throw new Error("Bucket not found.")
  }
  const prefix = url.pathname.split("/").filter(i=>i).splice(1).join("/") || undefined
  //note: example https://s3.us-west-002.backblazeb2.com/browser-screens/testing
  //note: hostname does not have port
  return {
      region: url.hostname.split(".").reverse()[2] || undefined,
      endpoint: url.origin,
      bucket,
      prefix,
  }
}
