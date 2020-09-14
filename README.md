# Trivial dynamic DNS using Route53 and a CGI script

This repository contains a trivial NodeJS program to update Route53
address records triggered by the invocation of a web URL.  I use an
Apache web server running on a virtual machine in the internet to run
the NodeJS program as a CGI script.  I then set up my Fritz box to
invoke the CGI script URL as dynamic DNS updater.

The format of the DDNS update URL needs to be:

    https://example.com/cgi-bin/dyndns-update?host=<hostname>&password=<password>

The provided [`dyndns-update` CGI frontend shell
script](dyndns-update) will need to be adapted to the needs of the
specific webserver environment.

The address that is registered under the host name is determined by
the environment variable `REMOTE_ADDR` which is set by the CGI.

The script supports multiple hosts, each protected by a (trivial)
password.  Each host needs to be configured in the `config.js` file
[see config-sample.js](config-sample.js).

This is designed to be a low-security system as the passwords are
stored in plain text.

## Testing

To test your config.js on the command line, you could run the script
in the shell like so:

    env REMOTE_ADDR=127.0.0.1 'QUERY_STRING=host=bonnie&password=secret' node index.js

If everything is configured correctly and a host "bonnie" with the
password "secret" exists, this should print

    Content-Type: text/plain

    IP address for bonnie.example.com set to 127.0.0.1
