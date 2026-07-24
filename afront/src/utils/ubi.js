export class UbiClient {
  constructor(baseUrl) {
    this.queryUrl = `${baseUrl}/ubi_queries`;
    this.verbose = 0;
  }

  async trackQuery(query, message = null, message_type = null) {
    if (message) {
      if (query.message) {
        query["extra_info"] = message;
        if (message_type) {
          query["extra_info_type"] = message_type;
        }
      } else {
        query.message = message;
        query.message_type = message_type;
      }
    }

    let json = JSON.stringify([query]);
    if (this.verbose > 0) {
      console.log("POSTing query: " + json);
    }

    return this._post(json, this.queryUrl);
  }

  async _post(data, url) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: data,
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }
}

export class UbiQueryRequest {
  constructor(
    application,
    client_id,
    query_id,
    user_query,
    object_id_field,
    query_attributes = {},
  ) {
    this.application = application;
    this.query_id = query_id;
    this.client_id = client_id;
    this.user_query = user_query;
    this.query_attributes = query_attributes;
    this.object_id_field = object_id_field;
    this.timestamp = new Date().toISOString();
  }

  static replacer(key, value) {
    return value == null ? undefined : value;
  }

  toJson() {
    return JSON.stringify(this, UbiQueryRequest.replacer);
  }
}
