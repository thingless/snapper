import { callJsonRpc, addJsonRpcListener } from './messaging'
import { getSettings } from '../util'

document.addEventListener("DOMContentLoaded", async function() {
   const { disabled } = await getSettings();
   if(disabled) return;
   const {loc, html} = getHtmlAndLocation()
   callJsonRpc(null, 'capturePage', loc, html)
});

function getHtmlAndLocation(){
   let ptr = document.body;
   while (ptr.parentNode?.parentNode) ptr = ptr.parentNode;
   return {
      loc: window.location.toString(),
      html: ptr?.outerHTML.toString(),
   }
}
addJsonRpcListener("getHtmlAndLocation", getHtmlAndLocation)