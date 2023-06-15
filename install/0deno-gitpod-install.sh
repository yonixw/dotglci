#Do on top level:
export DENO_INSTALL="/home/gitpod/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

curl -fsSL https://deno.land/x/install/install.sh | sh

deno completions bash >> \
     ~/.bashrc

echo updating deps
find . -name "deps.ts" | xargs -I{} bash -c \
    "echo {}; deno cache {}"

