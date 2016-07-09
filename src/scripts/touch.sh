#!/bin/zsh # TODO portability
while [ 1 ]; do
    gfind . -newer src/gameserver/app.clj \
	  -a \( -name "*.clj" \) \
	  -a -type f  \
	| xargs -I{} bash -c "echo {}; touch src/gameserver/app.clj";
    sleep 1;
done
