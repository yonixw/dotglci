# gitlab Reconfigured!

curl --fail --silent --header "Private-Token: ${PASS}" "http://localhost/api/v4/projects/${PROJECT}"


curl 'http://localhost:80/-/profile/personal_access_tokens' \
  -H 'accept: text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01' \
  -H 'content-type: application/x-www-form-urlencoded; charset=UTF-8' \
  -H '' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36' \
  --data-raw 'personal_access_token%5Bname%5D=root&personal_access_token%5Bexpires_at%5D=&personal_access_token%5Bscopes%5D%5B%5D=api&personal_access_token%5Bscopes%5D%5B%5D=read_api&personal_access_token%5Bscopes%5D%5B%5D=read_user&personal_access_token%5Bscopes%5D%5B%5D=read_repository&personal_access_token%5Bscopes%5D%5B%5D=write_repository&personal_access_token%5Bscopes%5D%5B%5D=sudo' \
  --compressed | jq .new_token
