#!/bin/bash

set -Ceu

declare -i count="${1:-3}"
declare -i h

for ((i=0; i<count; i+=1))
do
	h=$((i * 360 / count))
	bg='RGB:ef/f0/f1' # "TekHVC:$(((${h} + 180) % 360))/50/100"
	fg="TekHVC:$h/50/100"
	echo -n "$((i + 1)): "
	(set -x; xlogo -bg "${bg}" -fg "${fg}" -geometry 230x230 -render &)
	sleep 0.025s
done
