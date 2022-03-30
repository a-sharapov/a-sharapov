<script>
  import config from "$lib/config/main.js"
  
  const { siteLanguage, siteTitle, themeColor, defaultKeywords } = config
 
  export let title
  export let description = "Веб-архитектор, разработчик полного цикла, UX/UI-дизайнер"
  export let robots = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
  export let keywords = defaultKeywords

  const pageTitle = `${title} :: ${siteTitle}`
</script>

<svelte:head>
	<meta http-equiv="Content-language" content="{siteLanguage}" />
  <meta name="description" content="{description}" />
	<meta name="keywords" content="{keywords}" />
	<meta name="robots" content="{robots}" />
	<meta name="theme-color" content="{themeColor}" />
	<meta name="msapplication-navbutton-color" content="{themeColor}" />
  <title>{pageTitle}</title>
</svelte:head>