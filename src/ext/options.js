import 'file-loader?name=[name].[ext]!./options.html'
import 'bootstrap/dist/css/bootstrap.min.css'
import { setSettings, getSettings, parseS3Endpoint } from '../util'

async function validateOptions() {
    const endpointField = document.getElementById('s3Endpoint')
    endpointField.setCustomValidity("") //clear any old error set in js.
    try {
        parseS3Endpoint(endpointField.value)
    } catch (error) {
        endpointField.setCustomValidity(error.message);
        document.getElementById("s3EndpointInvalidHint").innerText = error.message;
    }
}

async function restoreOptions() {
    const { s3Endpoint, accessKeyId, secretAccessKey } = await getSettings()
    document.getElementById('s3Endpoint').value = s3Endpoint || '';
    document.getElementById('accessKeyId').value = accessKeyId || '';
    document.getElementById('secretAccessKey').value = secretAccessKey || '';
}

function initForm() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var form = document.querySelector('.needs-validation')
    form.addEventListener('submit', async function (event) {
        event.preventDefault()
        event.stopPropagation()
        form.classList.add('was-validated')
        await validateOptions()
        if (form.checkValidity()) {
            await setSettings({
                s3Endpoint: document.getElementById('s3Endpoint').value,
                accessKeyId: document.getElementById('accessKeyId').value,
                secretAccessKey: document.getElementById('secretAccessKey').value,
            });
            window.close()
        }
    }, false)
}

async function main() {
    initForm();
    await restoreOptions();
}
document.addEventListener("DOMContentLoaded", main);
