# nodejs-sso: Node.js Service

`nodejs-sso` is a simple demo on how to write a RESTful service with Node.js that is secured with Red Hat SSO 7.

There are 2 endpoints exposed by the service:

* `ping` - requires no authentication
* `securePing` - can be invoked by users with the `secure` role

## Pre-requisites
- Node.js v10+
- [Red Hat SSO 7.4](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.4/) server up and running
- CLI tools used for testing: `curl` (and/or [`HTTPie`](https://httpie.org/)) and [`jq`](https://stedolan.github.io/jq/)

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

    ```zsh
    npm install
    ```

2. Run the Node.js RESTful service

    ```zsh
    npm start
    ```

### Test with a regular `user`

Access should be denied because the `user`does not have the `secure` role.

1. Retrieve the user ${ACCESS_TOKEN}
    ```zsh
    ACCESS_TOKEN=$(curl -k -X POST \
    https://sso.apps.cluster-a9e8.sandbox1284.opentlc.com/auth/realms/nodejs-example/protocol/openid-connect/token \
    -H 'content-type: application/x-www-form-urlencoded' \
    -d 'username=user' \
    -d 'password=P@ssw0rd' \
    -d 'grant_type=password' \
    -d 'client_id=frontend-mock' \
    -d 'scope=openid nodejs-apiserver' | jq --raw-output '.access_token')
    ```

2. Call the Node.js service with the retrieved `user` ${ACCESS_TOKEN} **=> access should be denied**

    ```zsh
    curl -v -w '\n' http://localhost:8080/securePing -H "Authorization: Bearer ${ACCESS_TOKEN}"
    ```
    ```zsh
    *   Trying ::1...
    * TCP_NODELAY set
    * Connected to localhost (::1) port 8080 (#0)
    > GET /securePing HTTP/1.1
    > Host: localhost:8080
    > User-Agent: curl/7.64.1
    > Accept: */*
    > Authorization: Bearer ey[...]
    >
    < HTTP/1.1 403 Forbidden
    < X-Powered-By: Express
    < Access-Control-Allow-Origin: *
    < Set-Cookie: connect.sid=s%3Aq1p02Z7OspNGOd54DvETKko9dydR-BoZ.eR%2BcSEpbJ9G9lnl77eVGuVc9BfJRfLjD%2FiZ1hAv2gpk; Path=/; HttpOnly
    < Date: Sat, 04 Jul 2020 14:26:05 GMT
    < Connection: keep-alive
    < Transfer-Encoding: chunked
    <
    * Connection #0 to host localhost left intact
    Access denied
    * Closing connection 0
    ```

    or

    ```zsh
    http -v GET http://localhost:8080/securePing Authorization:"Bearer ${ACCESS_TOKEN}"
    ```
    ```zsh
    GET /securePing HTTP/1.1
    Accept: */*
    Accept-Encoding: gzip, deflate
    Authorization: Bearer ey[...]
    Connection: keep-alive
    Host: localhost:8080
    User-Agent: HTTPie/2.2.0

    HTTP/1.1 403 Forbidden
    Access-Control-Allow-Origin: *
    Connection: keep-alive
    Date: Sat, 04 Jul 2020 14:27:27 GMT
    Set-Cookie: connect.sid=s%3ASZzm7R6re18zH-pABwfZIy6sDcV1wFb_.KSplEs%2FvVg4kJZlqfArck2ZXH3WPRz%2F5YJtnDJ4SUQE; Path=/; HttpOnly
    Transfer-Encoding: chunked
    X-Powered-By: Express

    Access denied
    ```

### Test with the `admin` user

Access should be granted because the `admin`user has the `secure` role.

1. Retrieve the `admin` ${ACCESS_TOKEN}

    ```zsh
    ACCESS_TOKEN=$(curl -k -X POST \
    https://sso.apps.cluster-a9e8.sandbox1284.opentlc.com/auth/realms/nodejs-example/protocol/openid-connect/token \
    -H 'content-type: application/x-www-form-urlencoded' \
    -d 'username=admin' \
    -d 'password=P@ssw0rd' \
    -d 'grant_type=password' \
    -d 'client_id=frontend-mock' \
    -d 'scope=openid nodejs-apiserver' | jq --raw-output '.access_token')
    ```

2. Call the Node.js service with the retrieved `admin` ${ACCESS_TOKEN} **=> access should be granted**

    ```zsh
    curl -v -w '\n' http://localhost:8080/securePing -H "Authorization: Bearer ${ACCESS_TOKEN}"
    ```
    ```zsh
    *   Trying ::1...
    * TCP_NODELAY set
    * Connected to localhost (::1) port 8080 (#0)
    > GET /securePing HTTP/1.1
    > Host: localhost:8080
    > User-Agent: curl/7.64.1
    > Accept: */*
    > Authorization: Bearer ey[...]
    >
    < HTTP/1.1 200 OK
    < X-Powered-By: Express
    < Access-Control-Allow-Origin: *
    < Content-Type: application/json
    < Set-Cookie: connect.sid=s%3AJwa8grWNvxbZMXNa3l_2H126dm2bE6lV.fBZDmoe3nMymoFLjbe5Gf9C2BpEUqgST6wICQ1IneFs; Path=/; HttpOnly
    < Date: Sat, 04 Jul 2020 14:22:47 GMT
    < Connection: keep-alive
    < Transfer-Encoding: chunked
    <
    * Connection #0 to host localhost left intact
    {"message":"You did succeed to call the secure route ! :)"}
    * Closing connection 0
    ```

    or

    ```zsh
    http -v GET http://localhost:8080/securePing Authorization:"Bearer ${ACCESS_TOKEN}"
    ```
    ```zsh
    GET /securePing HTTP/1.1
    Accept: */*
    Accept-Encoding: gzip, deflate
    Authorization: Bearer ey[...]
    Connection: keep-alive
    Host: localhost:8080
    User-Agent: HTTPie/2.2.0

    HTTP/1.1 200 OK
    Access-Control-Allow-Origin: *
    Connection: keep-alive
    Content-Type: application/json
    Date: Sat, 04 Jul 2020 14:18:47 GMT
    Set-Cookie: connect.sid=s%3AvL4yRyIXO7KmNRK6uAgfoZTcBg0uWGDj.aAqTSP4bkIOEFp%2FacZ9iBraokk2uiWav7IZRuL7KYJM; Path=/; HttpOnly
    Transfer-Encoding: chunked
    X-Powered-By: Express

    {
        "message": "You did succeed to call the secure route ! :)"
    }
    ```

## Deploy on OpenShift

### Pre-requisites
- Access to a [Red Hat OpenShift](https://access.redhat.com/documentation/en-us/openshift_container_platform/4.3/) cluster v3 or v4
- User has self-provisioner privilege or has access to a working OpenShift project

### Deployment instructions

1. Login to the OpenShift cluster
    ```zsh
    oc login ...
    ```
2. Create an OpenShift project or use your existing OpenShift project. For instance, to create `nodejs-services`
    ```zsh
    oc new-project nodejs-services --display-name="Node.js Services"
    ```
3. Create the `nodejs-sso` OpenShift application from the git repository
    ```zsh
    oc new-app https://github.com/jeanNyil/nodejs-sso.git \
    --name=nodejs-sso \
    --image-stream="openshift/nodejs:12"
    ```
4. You can follow the log file of the S2I build
    ```zsh
    oc logs bc/nodejs-sso -f
    ```
    ```zsh
    Cloning "https://github.com/jeanNyil/nodejs-sso.git" ...
        Commit:	05ec011738cc6bb0b37136fc79599d36a4bed1ba (Updated README)
        Author:	jeanNyil <jean.nyilimbibi@gmail.com>
        Date:	Fri Apr 24 01:03:32 2020 +0200
    Caching blobs under "/var/cache/blobs".
    Getting image source signatures
    [...]
    Successfully pushed image-registry.openshift-image-registry.svc:5000/nodejs-services/nodejs-sso@sha256:7e14b1a55a19969f8a80a41719be6db4f68a2d6f54c3ccc68365c0d4bf91acb9
    Push successful
    ```
5. Verify that the `nodejs-sso` application pod is running
    ```zsh
    oc get po
    ```
    ```zsh
    NAME                  READY   STATUS      RESTARTS   AGE
    nodejs-sso-1-5m5v8    1/1     Running     0          9m4s
    nodejs-sso-1-build    0/1     Completed   0          9m54s
    nodejs-sso-1-deploy   0/1     Completed   0          9m7s
    ```
    Application logs (for _Red Hat OpenShift_ version < 4.5):
    ```zsh
    oc logs dc/nodejs-sso
    ```
    or, for _Red Hat OpenShift_ version >= 4.5:
    ```zsh
    oc logs deployment/nodejs-sso
    ```
    ```zsh
    Environment:
        DEV_MODE=false
        NODE_ENV=production
        DEBUG_PORT=5858
    Launching via npm...
    npm info it worked if it ends with ok
    npm info using npm@6.13.4
    npm info using node@v12.16.1
    npm info lifecycle nodejs-sso@1.0.0~prestart: nodejs-sso@1.0.0
    npm info lifecycle nodejs-sso@1.0.0~start: nodejs-sso@1.0.0

    > nodejs-sso@1.0.0 start /opt/app-root/src
    > ts-node server.ts

    Warning: connect.session() MemoryStore is not
    designed for a production environment, as it will leak
    memory, and will not scale past a single process.
    ==> Deactivating certificate validation ( /!\ not recommended in PRODUCTION! )
    env NODE_TLS_REJECT_UNAUTHORIZED:  0
    { message: 'App is now running on port 8080' } START
    ```
6. Create an non-secure route to expose the `nodejs-sso` RESTful service outside the OpenShift cluster.
    ```zsh
    oc expose svc/nodejs-sso \
    --hostname=nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com
    ```
    :warning: Specify the route `hostname` according to your OpenShift cluster

For instance, a test with the `admin` user access token should be successful:

```zsh
curl -v -w '\n' \
http://nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com/securePing \
-H "Authorization: Bearer ${ACCESS_TOKEN}"
```
```zsh
*   Trying 3.122.27.192...
* TCP_NODELAY set
* Connected to nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com (3.122.27.192) port 80 (#0)
> GET /securePing HTTP/1.1
> Host: nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com
> User-Agent: curl/7.64.1
> Accept: */*
> Authorization: Bearer ey[...]
>
< HTTP/1.1 200 OK
< x-powered-by: Express
< access-control-allow-origin: *
< content-type: application/json
< set-cookie: connect.sid=s%3Aa_Wn8wDu_FZqHLmQToklU1nLCIUEDRqY.8PqvQlWZdM9R5tCrt%2BXhryjHohMaTjE1t95J9d%2FdVrQ; Path=/; HttpOnly
< date: Sat, 04 Jul 2020 14:37:47 GMT
< transfer-encoding: chunked
< set-cookie: f7bbf60e2fa065e32c519de1ee433c61=028b24f44b80a29e63afe3ab0ac249df; path=/; HttpOnly
< cache-control: private
<
* Connection #0 to host nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com left intact
{"message":"You did succeed to call the secure route ! :)"}
* Closing connection 0
```

or

```zsh
http -v GET http://nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com/securePing \
Authorization:"Bearer ${ACCESS_TOKEN}"
```
```zsh
GET /securePing HTTP/1.1
Accept: */*
Accept-Encoding: gzip, deflate
Authorization: Bearer ey[...]
Connection: keep-alive
Host: nodejs-sso.apps.cluster-a9e8.sandbox1284.opentlc.com
User-Agent: HTTPie/2.2.0

HTTP/1.1 200 OK
access-control-allow-origin: *
cache-control: private
content-type: application/json
date: Sat, 04 Jul 2020 14:38:35 GMT
set-cookie: connect.sid=s%3A1N_EYd6ov-fDlBM4Q0nKzY4ry4t1q9Ly.sEBVT3aIu3ZROWCGLhrS0Lphqsn1VYCe%2FCKgseQFB9g; Path=/; HttpOnly
set-cookie: f7bbf60e2fa065e32c519de1ee433c61=028b24f44b80a29e63afe3ab0ac249df; path=/; HttpOnly
transfer-encoding: chunked
x-powered-by: Express

{
    "message": "You did succeed to call the secure route ! :)"
}
```