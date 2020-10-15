<script>
	let title = '';
	let description = '';
// currentValue - x
// maxValue - 100%
// maxValue * x = currentValue * 100
// x = currentValue * 100 / maxValue
const countPercent = (currentValue, maxValue) => {
	return parseInt(currentValue*100/maxValue);
}

$: titleProgress = countPercent(title.length,60);

$: descriptionProgress = countPercent(description.length,150)

</script>

<style>
	:global(body){
		display:grid;
		place-items: center;
		background: linear-gradient(125deg, #ECFCFF 0%, #ECFCFF 40%, #B2FCFF calc(40% + 1px), #B2FCFF 60%, #5EDFFF calc(60% + 1px), #5EDFFF 72%, #3E64FF calc(72% + 1px), #3E64FF 100%);
		overflow: hidden;
	}
	.progress::-webkit-progress-value {
  transition: width 0.2s ease;
}
</style>
<section class="section column is-one-quarter box">
    <div class="container">
      <h1 class="title">
        SEO Tool
      </h1>
      <p class="subtitle">
		Figure out how many characters you need in title and description!
      </p>
	</div>
	<div class="box mt-5" style="max-width: 600px; min-height: 142px;">
		<h3 style="font-size: 20px; color:#1a0dab;">{title}</h3>
		<p style="font-size: 14px;">{description}</p>
	</div>
	<div class="container mt-4">
	<div class="field">
		<label class="label">Title</label>
		<div class="control">
		  <input class="input" type="text" bind:value={title} placeholder="Title">
		</div>
	  </div>
	  <progress class="progress" class:is-danger="{title.length<30 || title.length>60}" class:is-warning="{title.length<50}" class:is-success={title.length>=50} value="{titleProgress}" max="100">{titleProgress}%</progress>
	  <div class="field">
		<label class="label">Description</label>
		<div class="control">
		  <input class="input" type="text" bind:value={description} placeholder="Description">
		</div>
	  </div>
	  <progress class="progress" class:is-danger="{description.length<100 || description.length>160}" class:is-warning="{description.length<140}" class:is-success={title.length>=140} value="{descriptionProgress}" max="100">{descriptionProgress}%</progress>
	</div>
	
	</section>

	
