const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

// spreadsheet key is the long id in the sheets URL
const doc = new GoogleSpreadsheet('1qm57SG2oA62Wq99oFA40ljNNQzOLCcVmsvAZVYRYODw');

async function handleForm(formData) {
    
    console.log('handleForm data: ', formData);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    await doc.loadInfo(); // loads document properties and worksheets
    console.log(doc.title);

    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
    console.log(sheet.title);
    console.log(sheet.rowCount);

    await sheet.addRow({
            s_no: '=ROW()-1',
            user_email: formData.userEmail,
            issue_title: formData.issueTitle,
            issue: formData.issue,
            buggy_link: formData.buggyLink,
        });
}

module.exports = handleForm;