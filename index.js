
const process = require('process');

const AWS = require('aws-sdk');
const route53 = new AWS.Route53();

const config = require('./config.js');

const setIpAddress = async (domain, ipAddress) =>
      (await route53.changeResourceRecordSets({
          HostedZoneId: config.zoneId,
          ChangeBatch: {
              Changes: [{
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                      Name: domain,
                      TTL: 60,
                      Type: 'A',
                      ResourceRecords: [
                          {
                              Value: ipAddress
                          }
                      ]
                  }
              }]
          }
      }).promise()).ChangeInfo.Id;

const checkCompletion = async (Id, resolve) => {
    const status = (await route53.getChange({ Id }).promise()).ChangeInfo.Status;
    if (status === 'INSYNC') {
        resolve();
    } else {
        setTimeout(() => checkCompletion(Id, resolve), 2000);
    }
}

const waitForChangeCompletion = (Id) =>
    new Promise(resolve => checkCompletion(Id, resolve));

const setIpAddressAndWait = async (domain, ipAddress) =>
      waitForChangeCompletion(await setIpAddress(domain, ipAddress));

const [_, host, password] = process.env.QUERY_STRING.match(/host=(.*)\&password=([^&]+)/);

console.log(`Content-Type: text/plain
`);

if (config.passwords[host] === password) {
    const fqdn = `${host}.${config.domain}`;
    setIpAddressAndWait(fqdn, process.env.REMOTE_ADDR)
        .then(() => console.log(`IP address for ${fqdn} set to ${process.env.REMOTE_ADDR}`))
        .catch((e) => {
            console.log(`Could not set IP address for ${fqdn} to ${process.env.REMOTE_ADDR}`);
            throw e;
        });
} else {
    console.log('no match');
}

