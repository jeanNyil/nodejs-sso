# nodejs-sso: Node.js Service

`nodejs-sso` is a simple demo on how to write a RESTful service with Node.js that is secured with Red Hat SSO 7.

There are 2 endpoints exposed by the service:

* `ping` - requires no authentication
* `securePing` - can be invoked by users with the `secure` role

## Pre-requisites
- Node.js v10+
- [Red Hat SSO 7.4](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.4/) server up and running

## Configuration in Red Hat SSO 7

The [nodejs-example_realm.json](./config/nodejs-example_realm.json) file is a full export of the `nodejs-example` Red Hat SSO Realm:

- 2 clients:
    - `frontend-mock`: a _public_ client used to obtain a user access token through the _direct access grant_ flow
    - `nodejs-apiserver`: a _bearer-only_ client used to secure the Node.js RESTful service
- A custom client scope (`nodejs-apiserver`) used to set the `nodejs-apiserver` _audience_ when requesting for a user access token.
- 2 realm roles: `secure` and `user`
- 2 users:
    - `admin` with the `secure` role
    - `user` with the `user` role

The following steps show how to import the `nodejs-example` realm in Red Hat SSO 7.4:

* Open the Red Hat SSO admin console
* Select `Add realm` from the `Select realm`menu
* Click `Select file` near the `import` field
* Navigate to the [nodejs-example_realm.json](./config/nodejs-example_realm.json) file location and select it
* Click `Create`

### :warning: Modify the `keycloak.json`

You have to adapt the `auth-server-url` property in the [keycloak.json](./keycloak.json) according to your Red Hat SSO 7 server.

## Test locally

### Build and run the Node.js RESTful service

1. Build:

    ```
    npm install
    ```

2. Run the Node.js RESTful service

    ```
    npm start
    ```

### Test with a regular `user`

Access should be denied because the `user`does not have the `secure` role.

1. Retrieve the user ${ACCESS_TOKEN}
    ```
    ACCESS_TOKEN=$(curl -k -X POST \
    https://secure-sso.apps.cluster-deae.sandbox235.opentlc.com/auth/realms/nodejs-example/protocol/openid-connect/token \
    -H 'content-type: application/x-www-form-urlencoded' \
    -d 'username=user' \
    -d 'password=P@ssw0rd' \
    -d 'grant_type=password' \
    -d 'client_id=frontend-mock' \
    -d 'scope=openid nodejs-apiserver' | jq --raw-output '.access_token')
    ```

2. Call the Node.js service with the retrieved `user` ${ACCESS_TOKEN} **=> access should be denied**

    ```
    curl -v -w '\n' http://localhost:8080/securePing -H "Authorization: Bearer ${ACCESS_TOKEN}"

    *   Trying ::1...
    * TCP_NODELAY set
    * Connected to localhost (::1) port 8080 (#0)
    [...]
    < HTTP/1.1 403 Forbidden
    < X-Powered-By: Express
    < Access-Control-Allow-Origin: *
    < Set-Cookie: connect.sid=s%3Avb5HEI8xc8sBDdbKyYazRbraf2xCzdmM.AyLZZvnE9T8%2F2%2FuR6KIHPOIgq7UahkBkVBf3dAkvrZQ; Path=/; HttpOnly
    < Date: Thu, 23 Apr 2020 20:52:30 GMT
    < Connection: keep-alive
    < Transfer-Encoding: chunked
    <
    * Connection #0 to host localhost left intact
    Access denied
    * Closing connection 0
    ```

### Test with the `admin` user

Access should be granted because the `admin`user has the `secure` role.

1. Retrieve the `admin` ${ACCESS_TOKEN}

    ```
    ACCESS_TOKEN=$(curl -k -X POST \
    https://secure-sso.apps.cluster-deae.sandbox235.opentlc.com/auth/realms/nodejs-example/protocol/openid-connect/token \
    -H 'content-type: application/x-www-form-urlencoded' \
    -d 'username=admin' \
    -d 'password=P@ssw0rd' \
    -d 'grant_type=password' \
    -d 'client_id=frontend-mock' \
    -d 'scope=openid nodejs-apiserver' | jq --raw-output '.access_token')
    ```

2. Call the Node.js service with the retrieved `admin` {ACCESS_TOKEN} **=> access should be granted**

    ```
    curl -v -w '\n' http://localhost:8080/securePing -H "Authorization: Bearer ${ACCESS_TOKEN}"

    *   Trying ::1...
    * TCP_NODELAY set
    * Connected to localhost (::1) port 8080 (#0)
    [...]
    < HTTP/1.1 200 OK
    < X-Powered-By: Express
    < Access-Control-Allow-Origin: *
    < Content-Type: application/json
    < Set-Cookie: connect.sid=s%3AiAY0_3O1agEMv6cOFukVLXgQ49vos8mo.421i0AYiqQEoUd5vEKWlnshE7Qgs4AYSom77urs89gs; Path=/; HttpOnly
    < Date: Thu, 23 Apr 2020 21:19:19 GMT
    < Connection: keep-alive
    < Transfer-Encoding: chunked
    <
    * Connection #0 to host localhost left intact
    {"message":"You did succeed to call the secure route ! :)"}
    * Closing connection 0
    ```