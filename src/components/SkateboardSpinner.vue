<template>
	<svg viewBox="0 0 176 160" width="176" height="160" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<linearGradient id="pl-grad" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="hsl(33,90%,55%)" />
				<stop offset="30%" stop-color="hsl(33,90%,55%)" />
				<stop offset="100%" stop-color="hsl(3,90%,55%)" />
			</linearGradient>
		</defs>
		<g fill="none" stroke-width="16" stroke-linecap="round">
			<circle class="pl__ring" r="56" cx="88" cy="96" stroke="hsla(0,10%,10%,0.1)" />
			<path class="pl__worm1" d="M144,96A56,56,0,0,1,32,96" stroke="url(#pl-grad)" stroke-dasharray="43.98 307.87" />
			<path
				class="pl__worm2"
				d="M32,136V96s-.275-25.725,14-40"
				stroke="hsl(33,90%,55%)"
				stroke-dasharray="0 40 0 44"
				stroke-dashoffset="0.001"
				visibility="hidden"
			/>
			<path
				class="pl__worm3"
				d="M144,136V96s.275-25.725-14-40"
				stroke="hsl(33,90%,55%)"
				stroke-dasharray="0 40 0 44"
				stroke-dashoffset="0.001"
				visibility="hidden"
			/>
		</g>
	</svg>
</template>

<style>
/* https://codepen.io/jkantner/pen/abEoyeK */
:root {
	--hue: 223;
}

.pl__ring,
.pl__worm1,
.pl__worm2,
.pl__worm3 {
	animation-duration: 4s;
	animation-iteration-count: infinite;
}

.pl__ring {
	stroke: hsla(var(--hue), 10%, 10%, 0.1);
}

.pl__worm1 {
	animation-name: worm1;
}

.pl__worm2 {
	animation-name: worm2;
	transform-origin: 32px 88px;
}

.pl__worm3 {
	animation-name: worm3;
	transform-origin: 144px 88px;
}

@keyframes worm1 {
	from {
		animation-timing-function: ease-out;
		stroke-dashoffset: 43.98;
	}
	12.5% {
		animation-timing-function: ease-in-out;
		stroke-dashoffset: -131.95;
	}
	25% {
		animation-timing-function: ease-in;
		stroke-dashoffset: 0;
	}
	37.5%,
	50% {
		animation-timing-function: ease-out;
		stroke-dashoffset: -175.93;
	}
	62.5% {
		animation-timing-function: ease-in-out;
		stroke-dashoffset: 0;
	}
	75% {
		animation-timing-function: ease-in;
		stroke-dashoffset: -131.95;
	}
	87.5%,
	to {
		stroke-dashoffset: 43.98;
	}
}

@keyframes worm2 {
	from,
	35.5% {
		animation-timing-function: linear;
		stroke-dasharray: 0 40 0 44;
		visibility: hidden;
		transform: translate(0, 0) rotate(0);
	}
	37.5% {
		animation-timing-function: ease-out;
		stroke-dasharray: 0 40 44 0;
		visibility: visible;
		transform: translate(0, 0) rotate(0);
	}
	47.5% {
		animation-timing-function: ease-in;
		stroke-dasharray: 0 4 40 40;
		visibility: visible;
		transform: translate(0, -80px) rotate(360deg);
	}
	50% {
		animation-timing-function: linear;
		stroke-dasharray: 0 4 40 40;
		visibility: visible;
		transform: translate(0, -36px) rotate(360deg);
	}
	52.5%,
	to {
		stroke-dasharray: 0 42 0 42;
		visibility: hidden;
		transform: translate(0, 12px) rotate(360deg);
	}
}

@keyframes worm3 {
	from {
		animation-timing-function: linear;
		stroke-dasharray: 0 4 40 40;
		visibility: visible;
		transform: translate(0, -36px) rotate(0);
	}
	2.5% {
		animation-timing-function: linear;
		stroke-dasharray: 0 42 0 42;
		visibility: hidden;
		transform: translate(0, 12px) rotate(0);
	}
	85.5% {
		animation-timing-function: linear;
		stroke-dasharray: 0 40 0 44;
		visibility: hidden;
		transform: translate(0, 0) rotate(0);
	}
	87.5% {
		animation-timing-function: ease-out;
		stroke-dasharray: 0 40 44 0;
		visibility: visible;
		transform: translate(0, 0) rotate(0);
	}
	97.5% {
		animation-timing-function: ease-in;
		stroke-dasharray: 0 4 40 40;
		visibility: visible;
		transform: translate(0, -80px) rotate(-360deg);
	}
	to {
		stroke-dasharray: 0 4 40 40;
		visibility: visible;
		transform: translate(0, -36px) rotate(-360deg);
	}
}
</style>
