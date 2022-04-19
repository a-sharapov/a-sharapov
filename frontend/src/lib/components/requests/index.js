const headers = new Headers();
headers.append("Content-Type", "application/json");
headers.append("Authorization", `Basic ${import.meta.env.VITE_DB_TOKEN}`);

const chunkDefaultFields = [
  "name",
  "value",
  "__createdtime__",
  "__updatedtime__",
]

const pageDefaultFields = [
  "title",
  "description",
  "content",
  "slug",  
  "keywords",
  "robots",
  "__createdtime__",
  "__updatedtime__",
]

const chunkRequestData = (name = null, fields = chunkDefaultFields) => {
  return JSON.stringify({
    "operation": "search_by_value",
    "schema": "content",
    "table": "pages",
    "search_attribute": "name",
    "search_value": name,
    "get_attributes": fields
  })
}

const pageRequestData = (slug = null, fields = pageDefaultFields) => { 
  return JSON.stringify({
    "operation": "search_by_value",
    "schema": "content",
    "table": "pages",
    "search_attribute": "slug",
    "search_value": slug,
    "get_attributes": fields,
  })
}

const requestOptions = (headers, body) => {
  return {
    method: 'post',
    redirect: 'follow',
    headers,
    body,
  }
}

export const getPageContent = async (slug, options = requestOptions, data = pageRequestData) => {
  const requestData = data(slug)
  const requestOptions = options(headers, requestData)
  return await fetch(`https://web-sharapov.harperdbcloud.com`, requestOptions)
}

export const getChunkContent = async (name, options = requestOptions, data = chunkRequestData) => {
  const requestData = data(name)
  const requestOptions = options(headers, requestData)
  return await fetch(`https://web-sharapov.harperdbcloud.com`, requestOptions)
}