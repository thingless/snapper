import {callJsonRpc} from './messaging'
import { getSettings } from '../util'

document.addEventListener("DOMContentLoaded", async function() {
   const { disabled } = await getSettings();
   if(disabled) return;
   let ptr = document.body;
   while (ptr.parentNode?.parentNode) ptr = ptr.parentNode;
   callJsonRpc(null, 'capturePage', window.location.toString(), ptr?.outerHTML.toString())
});
