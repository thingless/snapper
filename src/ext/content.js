import {guid} from '../util'
import {callJsonRpc} from './messaging'

document.addEventListener("DOMContentLoaded", function() {
   let ptr = document.body;
   while (ptr.parentNode?.parentNode) ptr = ptr.parentNode;
   callJsonRpc(null, 'capturePage', window.location.toString(), ptr?.outerHTML.toString())
});
