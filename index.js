
const process = require('process');

const { Route53Client, ChangeResourceRecordSetsCommand, GetChangeCommand } = require('@aws-sdk/client-route-53');
const route53 = new Route53Client();

const config = require('./config.js');

const setIpAddress = async (HostedZoneId, Name, ipAddress) =>
      (await route53.send(new ChangeResourceRecordSetsCommand({
          HostedZoneId,
          ChangeBatch: {
              Changes: [{
                  Action: 'UPSERT',
                  ResourceRecordSet: {
                      Name,
                      TTL: 60,
                      Type: ipAddress.match(/:/) ? 'AAAA' : 'A',
                      ResourceRecords: [
                          {
                              Value: ipAddress
                          }
                      ]
                  }
              }]
          }
      }))).ChangeInfo.Id;

const checkCompletion = async (Id, resolve) => {
    const status = (await route53.send(new GetChangeCommand({ Id }))).ChangeInfo.Status;
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

const params = new URLSearchParams(process.env.QUERY_STRING)
const host = params.get('host')
const password = params.get('password')
const ipaddr = params.get('ipaddr')
const ip6addr = params.get ('ip6addr')

console.log(`Content-Type: text/plain
`);

const hostConfig = config[host];
if (hostConfig && hostConfig.password === password) {
    if (ipaddr) {
        setIpAddressAndWait(hostConfig.zoneId, hostConfig.hostname, ipaddr)
            .then(() => console.log(`IP address for ${hostConfig.hostname} set to ${ipaddr}`))
            .catch((e) => {
                console.log(`Could not set IP address for ${hostConfig.hostname} to ${ipaddr}`);
                throw e;
            });
    }
    if (ip6addr) {
        setIpAddressAndWait(hostConfig.zoneId, hostConfig.hostname, ip6addr)
            .then(() => console.log(`IP address for ${hostConfig.hostname} set to ${ip6addr}`))
            .catch((e) => {
                console.log(`Could not set IP address for ${hostConfig.hostname} to ${ip6addr}`);
                throw e;
            });
    }
} else {
    console.log('no match');
}
