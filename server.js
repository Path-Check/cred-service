const express = require("express");
const CRED = require("@pathcheck/cred-sdk");

const app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const port = process.env.PORT || "8000";

const privateKey = process.env.K1 || `-----BEGIN EC PARAMETERS-----
BgUrgQQACg==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIPWKbSezZMY1gCpvN42yaVv76Lo47FvSsVZpQl0a5lWRoAcGBSuBBAAK
oUQDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR2jz/IK0R/F7/zXY1z+gqvFXf
DcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END EC PRIVATE KEY-----`

const publicKeyLink = process.env.K1LINK || '1A9.PCF.PW';

function getInitialsAndYear(fullName, dob) {
    var names = fullName.split(' '),
        initials = names[0].substring(0, 1).toUpperCase();
    
    if (names.length > 1) {
        initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }

    return initials + dob.substring(2,4);
}

function getDoses(badgeArrayCurr, badgeArrayPrevious) {
    if (!badgeArrayCurr) return "0";
    if (badgeArrayCurr.next_appointment) return "1";
    return "2";
}

async function sign(_type, _version, priKeyPEM, pubKeyId, payloadValueArray) {
    return await CRED.signAndPack(_type, _version, priKeyPEM, pubKeyId, payloadValueArray);
}

app.post('/status', async function (req, res) {
    console.log(req.body);

    let raw = { 
        fullName: req.body.fullName, 
        dob: req.body.dob 
    } 
    let signedCerts = {
        raw
    }

    const initals = getInitialsAndYear(req.body.fullName, req.body.dob);
    const statusArray = ["2",,initals];

    signedCerts['immunizationStatusQR'] = await sign("status","2", privateKey, publicKeyLink, statusArray);

    res.send(signedCerts);
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

// run with: 
// curl -X POST -d '{"fullName":"Vitor Pamplona", "dob":"1922-07-27"}' -H 'Content-Type: application/json' http://localhost:8000/status
