#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

bazel test //...
bazel run //server:image_push
ssh -t mulambda@bsky.mulambda.de 'sudo bash ~/update-mvv-proxy.sh'
