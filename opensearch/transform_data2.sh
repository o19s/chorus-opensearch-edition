#!/bin/bash

# modified from transform_data.sh to extract the 1st ean and make that the primary_ean
# other minor changes were attempts at speeding this up

# This script transforms the downloaded and extracted 19k products from the icecat dataset.
# Transformation idea taken from https://www.starkandwayne.com/blog/bash-for-loop-over-json-array-using-jq/
# The script iterates through the JSON file and encodes each JSON element as a base64 string.
# Afterwards, the string is decoded and prefixed with {"index" : {}} to reflect the structure
# needed by OpenSearch.

for row in $(cat icecat-products-w_price-19k-20201127.json | jq -r '.[] | @base64'); do
    my_line=$(echo ${row} | base64 --decode)

# ******************************************************
#	id=$(echo ${my_line} | jq -r .id)
#	ean=$(echo ${my_line} | jq -r .ean[0])
# combine the 2 calls above into one jq:
	id_ean=$(echo ${my_line} | jq -r .id,.ean[0])

	#read the \n delimited string into an array
	readarray -t arr <<<"$id_ean"; declare arr;
	id=${arr[0]}
	ean=${arr[1]}
# ******************************************************

   echo { \"index\" : {\"_id\" : \"${id}\"}
   
   #add line with a new primary_ean field
   echo ${my_line} | jq -rc ".primary_ean |= . + \"${ean}\""
done
