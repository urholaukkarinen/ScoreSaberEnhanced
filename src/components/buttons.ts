import * as beatsaver from "../api/beatsaver";
import * as beatmaps from "../api/beatmaps";
import { BulmaSize } from "../declarations/Types";
import * as env from "../env";
import g from "../global";
import { create } from "../util/dom";
import { toggled_class } from "../util/format";
import { oneclick_install } from "../util/song";

export function generate_beatsaver(song_hash: string | undefined, size: BulmaSize): HTMLElement {
	return create("div", {
		class: `button icon is-${size} ${toggled_class(size !== "large", "has-tooltip-left")} beatsaver_bg_btn`,
		style: {
			cursor: song_hash === undefined ? "default" : "pointer",
			padding: "0",
		},
		disabled: song_hash === undefined,
		data: { tooltip: "View on BeatSaver" },
		onclick() {
			checked_hash_to_song_info(this as any, song_hash)
				.then(song_info => new_page(g.beatsaver_link + song_info.key))
				.catch(() => failed_to_download(this as any));
		},
	},
		create("div", { class: "beatsaver_bg" }),
	);
}

export function generate_oneclick(song_hash: string | undefined, size: BulmaSize): HTMLElement {
	return create("div", {
		class: `button icon is-${size} ${toggled_class(size !== "large", "has-tooltip-left")}`,
		style: {
			cursor: song_hash === undefined ? "default" : "pointer",
		},
		disabled: song_hash === undefined,
		data: { tooltip: env.get_use_beatmaps()
			? "Download via BeatMaps.io"
			: "Download with OneClick™" },
		onclick() {
			checked_hash_to_song_key(this as any, song_hash)
				.then(oneclick_install)
				.then(() => ok_after_download(this as any))
				.catch(() => failed_to_download(this as any));
		},
	},
		create("i", { class: "fas fa-cloud-download-alt" }),
	);
}

export function generate_bsaber(song_hash: string | undefined): HTMLElement {
	return create("a", {
		class: "button icon is-large",
		style: {
			cursor: song_hash === undefined ? "default" : "pointer",
			padding: "0",
		},
		disabled: song_hash === undefined,
		data: { tooltip: "View/Add rating on BeastSaber" },
		async onclick() {
			checked_hash_to_song_info(this as any, song_hash)
				.then(song_info => new_page(g.bsaber_songs_link + song_info.key))
				.catch(() => failed_to_download(this as any));
		},
	},
		create("div", {
			style: {
				backgroundImage: "url(\"https://bsaber.com/wp-content/themes/beastsaber-wp-theme/assets/img/avater-callback.png\")",
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "center",
				width: "100%",
				height: "100%",
				borderRadius: "inherit",
			}
		}),
	);
}

export function generate_bsaber_bookmark(song_hash: string | undefined, size: BulmaSize): HTMLElement {
	const bookmarked = song_hash === undefined ? false : env.check_bsaber_bookmark(song_hash);
	const color = bookmarked ? "is-success" : "is-danger";
	const tooltip = bookmarked ? "Bookmarked on BeastSaber" : "Not Bookmarked on BeastSaber";
	return create("div", {
		class: `button icon is-${size} ${color} ${toggled_class(size !== "large", "has-tooltip-left")}`,
		style: {
			cursor: song_hash === undefined ? "default" : "pointer",
			padding: "0",
		},
		disabled: song_hash === undefined,
		data: { tooltip: tooltip },
		onclick() {
			checked_hash_to_song_info(this as any, song_hash)
				.then(song_info => new_page(g.bsaber_songs_link + song_info.key))
				.catch(() => failed_to_download(this as any));
		},
	},
		create("i", { class: `fas fa-thumbtack` }),
	);
}

export function generate_preview(song_hash: string | undefined): HTMLElement {
	return create("div", {
		class: "button icon is-large",
		style: {
			cursor: song_hash === undefined ? "default" : "pointer",
			padding: "0",
		},
		disabled: song_hash === undefined,
		data: { tooltip: "Preview map" },
		onclick() {
			checked_hash_to_song_info(this as any, song_hash)
				.then(song_info => new_page("https://skystudioapps.com/bs-viewer/?id=" + song_info.key))
				.catch(() => failed_to_download(this as any));
		},
	},
		create("i", { class: "fas fa-glasses" }),
	);
}

export function generate_copy_bsr(song_hash: string | undefined): HTMLElement {
	const txtDummyNode = create("input", {
		style: {
			position: "absolute",
			top: "0px",
			left: "-100000px",
		}
	});
	return create("a", {
		class: "button icon is-large",
		style: {
			cursor: song_hash === undefined ? "default" : "pointer",
			padding: "0",
		},
		disabled: song_hash === undefined,
		data: { tooltip: "Copy !bsr" },
		onclick() {
			checked_hash_to_song_info(this as any, song_hash)
				.then(song_info => {
					txtDummyNode.value = `!bsr ${song_info.key}`;
					txtDummyNode.select();
					txtDummyNode.setSelectionRange(0, 99999);
					document.execCommand("copy");
					ok_after_download(this as any);
				})
				.catch(() => failed_to_download(this as any));
		},
	},
		txtDummyNode,
		create("i", { class: "fas fa-exclamation" }),
	);
}

async function checked_hash_to_song_key(ref: HTMLElement, song_hash: string | undefined): Promise<string> {
	reset_download_visual(ref);
	if (song_hash === undefined) { failed_to_download(ref); throw new Error("song_hash is undefined"); }

	let song_key = undefined;
	if (env.get_use_beatmaps()) {
		const song_info = await beatmaps.get_data_by_hash(song_hash);
		song_key = song_info?.id.toString();
	} else {
		const song_info = await beatsaver.get_data_by_hash(song_hash);
		song_key = song_info?.key;
	}
	
	if (song_key === undefined) { failed_to_download(ref); throw new Error("song_info is undefined"); }
	return song_key;
}

async function checked_hash_to_song_info(ref: HTMLElement, song_hash: string | undefined): Promise<beatsaver.IBeatSaverData> {
	reset_download_visual(ref);
	if (song_hash === undefined) { failed_to_download(ref); throw new Error("song_hash is undefined"); }
	const song_info = await beatsaver.get_data_by_hash(song_hash);
	if (song_info === undefined) { failed_to_download(ref); throw new Error("song_info is undefined"); }
	return song_info;
}

// *** Utility ***

function reset_download_visual(ref: HTMLElement | undefined) {
	if (ref) {
		ref.classList.remove("button_success");
		ref.classList.remove("button_error");
	}
}

function failed_to_download(ref: HTMLElement | undefined) {
	if (ref) {
		ref.classList.add("button_error");
	}
}

function ok_after_download(ref: HTMLElement | undefined) {
	if (ref) {
		ref.classList.add("button_success");
	}
}

function new_page(link: string): void {
	window.open(link, "_blank");
}
