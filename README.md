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

The script supports multiple hosts, each protected by a (trivial)
password.  Each host needs to be configured in the `config.js` file
[see config-sample.js](config-sample.js).

This is designed to be a low-security system as the passwords are
stored in plain text.
