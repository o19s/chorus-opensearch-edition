package main

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"github.com/Jeffail/gabs/v2"
	"github.com/tidwall/gjson"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"strings"
)

type Proxy struct {
	target *url.URL
	proxy  *httputil.ReverseProxy
}

func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	bytedata, _ := ioutil.ReadAll(r.Body)
	reqBodyString := string(bytedata)

	newBodyContent := reqBodyString

	r.Body = io.NopCloser(strings.NewReader(newBodyContent))

	r.ContentLength = int64(len(newBodyContent))
	r.Host = p.target.Host

	p.proxy.ServeHTTP(w, r)
}

func rewriteBody(resp *http.Response) (err error) {

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	err = resp.Body.Close()
	if err != nil {
		return err
	}

	content := string(b[:])
	queryId := gjson.Get(content, "ext.ubi.query_id")
	productMargin := gjson.Get(content, "ext.ubi.attributes.product_margin")

	fmt.Println(queryId)
	fmt.Println(productMargin)

	jsonParsed, _ := gabs.ParseJSON(b)

	_ = jsonParsed.DeleteP("ext.ubi.attributes.product_margin")

	// TODO: Send productMargin somewhere else.

	body := io.NopCloser(bytes.NewReader(jsonParsed.Bytes()))
	resp.Body = body
	resp.ContentLength = int64(len(b))
	resp.Header.Set("Content-Length", strconv.Itoa(len(b)))

	return nil

}

func getEnv(key, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		value = fallback
	}
	return value
}

func main() {

	opensearchEndpoint := getEnv("OPENSEARCH_ENDPOINT", "http://localhost:9200/ecommerce/_search")

	target, err := url.Parse(opensearchEndpoint)
	if err != nil {
		panic(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	proxy.Transport = &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}

	p := &Proxy{target: target, proxy: proxy}
	proxy.ModifyResponse = rewriteBody

	port := getEnv("PANAMA_PORT", "8080")

	fmt.Println("Started panama on port " + port)
	err = http.ListenAndServe(":"+port, p)

	if err != nil {
		panic(err)
	}

}
