
const process = require('process');

const AWS = require('aws-sdk');
const route53 = new AWS.Route53();

const config = require('./config.js');

const setIpAddress = async (HostedZoneId, Name, ipAddress) =>
      (await route53.changeResourceRecordSets({
          HostedZoneId,
          ChangeBatch: {
              Changes: [{
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                      Name,
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

const setIpAddressAndWait = async (zoneId, domain, ipAddress) =>
      waitForChangeCompletion(await setIpAddress(zoneId, domain, ipAddress));

const [_, host, password] = process.env.QUERY_STRING.match(/host=(.*)\&password=([^&]+)/);

console.log(`Content-Type: text/plain
`);

const hostConfig = config[host];
if (hostConfig && hostConfig.password === password) {
    setIpAddressAndWait(hostConfig.zoneId, hostConfig.hostname, process.env.REMOTE_ADDR)
        .then(() => console.log(`IP address for ${hostConfig.hostname} set to ${process.env.REMOTE_ADDR}`))
        .catch((e) => {
            console.log(`Could not set IP address for ${hostConfig.hostname} to ${process.env.REMOTE_ADDR}`);
            throw e;
        });
} else {
    console.log('no match');
}

