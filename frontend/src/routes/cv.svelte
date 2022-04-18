<script context="module">
  import { getPageContent } from "$lib/components/requests/"

  export async function load() {
    try {
      const response = await getPageContent("cv")
      return {
        props: {
          pages: response.ok && (await response.json()),
        }
      }
    } catch (e) {
      return {
        status: e.status,
        error: e.message, 
      }
    }
  }
</script>

<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import CV from "$lib/components/chunks/cv.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"
  import Sidebar from "$lib/components/chunks/sidebar.svelte"
  import Loader from "$lib/components/ui/loader.svelte"

  import { status, loading, b64DecodeUnicode } from "$lib/components/utils/"

  export let pages
  let page = pages[0]
  
  status.set("cv")

  let age = new Date().getFullYear() - 1987
  let experience = new Date().getFullYear() - 2010

  browser && (
    page.title = "CV - " + page.title,
    loading.set(false)
  )
</script>

<Head title="{page.title}" />
<Content {status} {loading}>
  <Sidebar />
  <CV {status} {loading}>
    <Loader {loading} />
    {#if page.content && browser}
      {@html b64DecodeUnicode(page.content).replace(/{age}/g, age).replace(/{experience}/g, experience)}
    {/if}
  </CV>
</Content>
<Composition {status} />

<style>
:global(.content strong.hight) {
  font-size: 120%;
}
:global(.content .cv-photo) {
  position: absolute;
  right: 0;
  top: 0;
}
:global(.content .cv-photo > img) {
  display: block;
}
:global(.content .button > img) {
  vertical-align: middle;
  margin: 0 5px 4px 0;
}
:global(.content .row) {
  position: relative;
  display: inline-block;
  vertical-align: top;
  width: 50%;
  padding: 20px 40px;
}
:global(.content .row + hr) {
  margin: 0;
}
:global(.content .row.full) {
  width: 100%;
}
:global(.content .row h5 img) {
  vertical-align: middle;
  margin-right: 3px;
  margin-top: -6px;
  height: 28px;
  width: auto;
}
:global(.content table) {
  width: 100%;
}
:global(.content table tr) {
  background: none;
}
:global(.content table td) {
  vertical-align: top;
  width: calc(100% / 6);
  border: none;
}
:global(.content table ul) {
  display: inline-block;
  vertical-align: top;
}
:global(.content table ul li::marker) {
  color: #777;
}
:global(.content table h5) {
  width: fit-content;
  padding: 0 10px;
  background: #00000010;
  line-height: 40px;
  font-weight: bold;
  border-radius: 4px;
}
</style>