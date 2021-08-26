const express = require("express");
const CRED = require("@pathcheck/cred-sdk");
const DCC = require("@pathcheck/dcc-sdk");

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

function getInitialsAndYear(givenName, familyName, dob) {
    let initials = givenName.substring(0, 1).toUpperCase()
                 + familyName.substring(0, 1).toUpperCase();

    return initials + dob.substring(2,4);
}

function splitNameAndGetInitialsAndYear(fullName, dob) {
    let names = fullName.split(' ');
    return getInitialsAndYear(names[0], names[names.length - 1], dob);
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

    const initals = splitNameAndGetInitialsAndYear(req.body.fullName, req.body.dob);
    const statusArray = ["2",,initals];

    signedCerts['immunizationStatusQR'] = await sign("status","2", privateKey, publicKeyLink, statusArray);

    res.send(signedCerts);
});

app.post('/hc1status', async function (req, res) {
    console.log(req.body);

    const verified = await DCC.unpackAndVerify(req.body.qr);

    if (!verified) {
        res.send({status: "Unable to Verify"});
        return;
    }

    const data = await DCC.parseCWT(verified);
    
    if (data && data.v && data.v.length > 0 && data.v[0]) { 
        // Has a vaccination record.

        if (data.v[0].dn < data.v[0].sd) {
            res.send({status: "Not Fully Vaccinated", certificate: verified});
            return;
        }

        let raw = { 
            fullName: data.nam.gn + " " + data.nam.fn, 
            dob: data.dob
        } 
        let signedCerts = {
            raw
        }

        const initals = getInitialsAndYear(data.nam.gn, data.nam.fn, data.dob);
        const statusArray = ["2",,initals];

        signedCerts['immunizationStatusQR'] = await sign("status","2", privateKey, publicKeyLink, statusArray);

        res.send(signedCerts);
        return;
    }
 
    res.send({status: "Unable to Decode Certificate", certificate: verified});
    return;
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

// run with: 
// curl -X POST -d '{"fullName":"Vitor Pamplona", "dob":"1922-07-27"}' -H 'Content-Type: application/json' http://localhost:8000/status
// 2 doses: curl -X POST -d '{"qr":"HC1:NCFOXN%TSMAHN-H3O4:PVH AJ2J$9J0II:Q5 43SLG/EBUD2XPO.TM8W42YBJSRQHIZC4.OI1RM8ZA*LPUY29+KCFF-+K*LPH*AA:G$LO5/A+*39UVC 0G8C:USOHDAPSY+3AZ33M3JZIM-1Z.4UX4795L*KDYPWGO+9AAEOXCRFE4IWMIT5NR7LY4357LC4DK4LC6DQ42JO9X7M16GF6:/6N9R%EP3/28MJE9A7EDA.D90I/EL6KKLIIL4OTJLI C3DE0OA0D9E2LBHHGKLO-K%FGLIA-D8+6JDJN XGHFEZI9$JAQJKHJLK3M484SZ4RZ4E%5MK9AZPKD70/LIFN7KTC5NI%KH NVFWJ-SUQK8%MPLI8:31CRNHS*44+4BM.SY$NOXAJ8CTAP1-ST*QGTA4W7.Y7N31D6K-BW/ N NRM1U*HFNHJ9USSK380E%WISO9+%GRTJ GBW0UEFJ42SUTU9I8/MD3N3ARC/03W-RHDMO1VC767.P95G-CFA.7L C02FM8F6UF"}' -H 'Content-Type: application/json' http://localhost:8000/hc1status
// 1 dose: curl -X POST -d '{"qr":"HC1:6BFF80W80T9WTWGSLKC 4769R174TF//5P30FBBHB4WY0VCC9/TFN0NAD2Q1*70J+9D97TK0F90$PC5$CUZC $5Y$5TPCBEC7ZKW.C$$EE/44LEJXOF/D234U44CECT34AEC1$C JCA/DY+8CEC2XO 3EAPEKI9CECLPCG/DGEERB8.NAQ+9BS7NB8.R7LB8CY8MPCG/DT D.HAA+921ANNAXH9NB8JPCT3E6JD646CA78465W5X577:EDOL9WEQDD+Q6TW6FA7C466KCN9E%961A6DL6FA7D46.JCP9EJY8L/5M/5546.96VF6.JCBECB1A-:8$966469L6OF6VX6FVC*70KQEPD0LVC6JD846Y96B463W5VX6UPCBJCOT9+ED83EZED+EDKWE3EFX3E/34Z1BWJC0FD4X4:KEPH7M/ESDD746VG7TS9 6A1B8MZAHNA356TR6/IBV+A2T9Z%6ZB827BJ6F4*AX48WJDZ%1TJHC0Q/TFLX67MHSFT-%0JELBSOC4V+XIK9CW3PDIN7886IIRWL-WQ2-9A-9%QJ*DMPHMCNH%ZR0%U7:JXJD-3H"}' -H 'Content-Type: application/json' http://localhost:8000/hc1status
// 3 doses: curl -X POST -d '{"qr":"HC1:6BFOXN%TSMAHN-H+XO5XF7:UY%FJ.G0IIXLHKHR6H2LDSOIMI%C9 SLAP9.SURC/GPWBI$C9UDBQEAJJKIIIEC8.-B97U: K8*NHQ2VAP1US1Q7OKHHUEPOP%WUXQ72QETZU3UQRVULKHWWU:16Q8Q*7R-PP9$PB/9OK5JWEMN1/9VSL1Y813.UNNUR+UK0VF/94O5%ZE/NEVTEJAVX5NGTUY*U9/9-3APF6:66A$QX76LZ6Q59YPDN*I4OIMEDTJCJKDLEDL9CZTAKBI/8D:8DKTDL+S/15A+2XEN QT QTHC31M3+E3+T4D-4HRVUMNMD3323623423.LJX/KS968X2+36/-KW10SW6A$Q836BPK$*SQDKVLI7VHB$FNXUJRH0LH%Y2 UQ/RONSGWLIML5YO9OUUMK9WLIK*L5R1G-VOXL2VFLW5BWOM-PDNK7NGXH43R3/YF9$R2SK3S3:BO5Y5N3W5/UZ1T4+R8F4SF91.JYRSF+J6:L$XNRBEZ.MMC4TBQ $D-8RS7FE7BH7T/*S4 KWSDNQIS.123K$*SB$BI/O:I8PXLQH1/HN:UG"}' -H 'Content-Type: application/json' http://localhost:8000/hc1status