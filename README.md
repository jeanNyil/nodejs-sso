# nodejs-sso: Node.js Service

`nodejs-sso` is a simple demo on how to write a RESTful service with Node.js that is secured with Red Hat SSO 7.

There are 2 endpoints exposed by the service:

* `ping` - requires no authentication
* `securePing` - can be invoked by users with the `secure` role

## Pre-requisites
- Node.js v10+
- [Red Hat SSO 7.4](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.4/) server up and running
- CLI tools used for testing: `curl` and [`jq`](https://stedolan.github.io/jq/)

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
    https://secure-sso.apps.cluster-ca12.sandbox735.opentlc.com/auth/realms/nodejs-example/protocol/openid-connect/token \
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
    ```
    ```
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
    https://secure-sso.apps.cluster-ca12.sandbox735.opentlc.com/auth/realms/nodejs-example/protocol/openid-connect/token \
    -H 'content-type: application/x-www-form-urlencoded' \
    -d 'username=admin' \
    -d 'password=P@ssw0rd' \
    -d 'grant_type=password' \
    -d 'client_id=frontend-mock' \
    -d 'scope=openid nodejs-apiserver' | jq --raw-output '.access_token')
    ```

2. Call the Node.js service with the retrieved `admin` ${ACCESS_TOKEN} **=> access should be granted**

    ```
    curl -v -w '\n' http://localhost:8080/securePing -H "Authorization: Bearer ${ACCESS_TOKEN}"
    ```
    ```
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

## Deploy on OpenShift

### Pre-requisites
- Access to a [Red Hat OpenShift](https://access.redhat.com/documentation/en-us/openshift_container_platform/4.3/) cluster v3 or v4
- User has self-provisioner privilege or has access to a working OpenShift project

### Deployment instructions

1. Login to the OpenShift cluster
    ```
    oc login ...
    ```
2. Create an OpenShift project or use your existing OpenShift project. For instance, to create `nodejs-services`
    ```
    oc new-project nodejs-services
    ```
3. Create the `nodejs-sso` OpenShift application from the git repository
    ```
    oc new-app nodejs:10-SCL~https://github.com/jeanNyil/nodejs-sso.git --name=nodejs-sso
    ```
4. You can follow the log file of the S2I build
    ```
    oc logs bc/nodejs-sso -f
    ```
    ```
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
    ```
    oc get po
    ```
    ```
    NAME                  READY   STATUS      RESTARTS   AGE
    nodejs-sso-1-5m5v8    1/1     Running     0          9m4s
    nodejs-sso-1-build    0/1     Completed   0          9m54s
    nodejs-sso-1-deploy   0/1     Completed   0          9m7s
    ```
    ```
    oc logs dc/nodejs-sso
    ```
    ```
    Environment:
        DEV_MODE=false
        NODE_ENV=production
        DEBUG_PORT=5858
    Launching via npm...
    npm info it worked if it ends with ok
    npm info using npm@6.13.4
    npm info using node@v10.19.0
    npm info lifecycle nodejs-sso@1.0.0~prestart: nodejs-sso@1.0.0
    npm info lifecycle nodejs-sso@1.0.0~start: nodejs-sso@1.0.0

    > nodejs-sso@1.0.0 start /opt/app-root/src
    > ts-node server.ts

    Warning: connect.session() MemoryStore is not
    designed for a production environment, as it will leak
    memory, and will not scale past a single process.
    ==> Deactivating certificate validation ( /!\ not recommended in PRODUCTION! )
    env NODE_TLS_REJECT_UNAUTHORIZED:  0
    { message: 'App is now running on port 8080' } 'START'
    ```
6. Create an non-secure route to expose the `nodejs-sso` RESTful service outside the OpenShift cluster.
    ```
    oc expose svc/nodejs-sso \
    --hostname=nodejs-sso.apps.cluster-ca12.sandbox735.opentlc.com
    ```
    :warning: Specify the route `hostname` according to your OpenShift cluster

For instance, a test with the `admin` user access token should be successful:

```
curl -v -w '\n' \
http://nodejs-sso.apps.cluster-ca12.sandbox735.opentlc.com/securePing \
-H "Authorization: Bearer ${ACCESS_TOKEN}"
```
```
*   Trying 52.58.166.129...
[...]
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Access-Control-Allow-Origin: *
< Content-Type: application/json
< Set-Cookie: connect.sid=s%3A6htDTJfgLeKinVnsqtDdC8kbGTQJmDsu.bDkbOIxTpcRmeVAjD3ndQhp85Oz17l2VrsP7syhFEQA; Path=/; HttpOnly
< Date: Thu, 23 Apr 2020 23:34:03 GMT
< Transfer-Encoding: chunked
< Set-Cookie: 0082891b4163c99f8d261149490b3b45=217072bdc42ba6d0b8ce9a93dd893d3a; path=/; HttpOnly
< Cache-control: private
<
* Connection #0 to host nodejs-sso.apps.cluster-ca12.sandbox735.opentlc.com left intact
{"message":"You did succeed to call the secure route ! :)"}
* Closing connection 0
```