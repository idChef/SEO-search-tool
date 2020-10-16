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
		word-break:break-word;
	}
	.progress::-webkit-progress-value {
  transition: width 0.2s ease;
}

.sub-label{
	font-size: 12px;
	font-weight: 500;
}
</style>
<section class="section column is-one-quarter box is-4-widescreen is-6-desktop is-8-tablet">
    <div class="container">
      <h1 class="title">
        SEO Tool
      </h1>
      <p class="subtitle">
		Figure out how many characters you need in title and description tag!
      </p>
	</div>
	<div id="preview" class="box mt-5" style="max-width: 600px; margin: 0 auto; min-height: 142px;">
		<h3 style="font-size: 20px; color:#1a0dab;">{title}</h3>
		<p style="font-size: 14px;">{description}</p>
	</div>
	<div class="container mt-4">
	<div class="field">
		<label class="label">Title <span class="sub-label">{title.length} characters</span></label>
		<div class="control">
			<textarea id="title" class="textarea" bind:value={title} rows="1" placeholder="Title"></textarea>
		</div>
	  </div>
	  <progress class="progress" class:is-danger="{title.length<30 || title.length>60}" class:is-warning="{title.length<50}" class:is-success={title.length>=50} value="{titleProgress}" max="100">{titleProgress}%</progress>
	  <div class="field">
		<label class="label">Description <span class="sub-label">{description.length} characters</span></label>
		<div class="control">
			<textarea class="textarea" bind:value={description} rows="1" placeholder="Description"></textarea>
		</div>
	  </div>
	  <progress class="progress" class:is-danger="{description.length<100 || description.length>160}" class:is-warning="{description.length<140}" class:is-success={description.length>=140} value="{descriptionProgress}" max="100">{descriptionProgress}%</progress>
	</div>
	</section>


	