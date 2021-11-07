import 'file-loader?name=[name].[ext]!./popup.html'
import 'bootstrap/dist/css/bootstrap.min.css'
import { setSettings, getSettings } from '../util'
import { callJsonRpc, addJsonRpcListener } from './messaging'

async function main() {
    const { disabled } = await getSettings();
    const checkbox = document.getElementById("disableCheckbox")
    checkbox.checked = !disabled;
    checkbox.addEventListener('change', function () {
        setSettings({ disabled: !this.checked })
        callJsonRpc(null, 'refreshIconStatus')
    });
}
document.addEventListener("DOMContentLoaded", main);
