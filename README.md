# snobify
Erase songs too popular for your stature.


`docker build -t snobify:x.x .`

`docker run -d -e VIRTUAL_HOST=snobbify.me snobify:x.x`

(require jwilder/nginx-proxy for reverse proxy virtual host in docker)
