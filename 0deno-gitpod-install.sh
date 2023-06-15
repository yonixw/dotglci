curl -fsSL https://deno.land/x/install/install.sh | sh
alias deno=/home/gitpod/.deno/bin/deno
find . -name "deps.ts" | xargs deno cache