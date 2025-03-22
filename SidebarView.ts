import { ItemView, WorkspaceLeaf, TFile } from "obsidian";

export const VIEW_TYPE_CUSTOM_SIDEBAR = "filtered-backlinks-sidebar";

export class CustomSidebarView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CUSTOM_SIDEBAR;
	}

	getDisplayText(): string {
		return "Filtered Backlinks";
	}

	async onOpen() {
		this.updateView();

		// Listen for file changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.updateView();
			})
		);
	}

	updateView() {
		// Get the sidebar container and clear previous content
		const container = this.containerEl.children[1];
		container.empty();

		// Get the currently active file
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			container.createEl("p", { text: "No active note selected." });
			return;
		}

		// Display the name of the current note
		container.createEl("h3", { text: `Backlinks for ${activeFile.basename}` });

		const incoming = this.getIncomingLinksv2(activeFile);
		console.log("Incoming Links:", incoming);
		const outgoing = this.getOutgoingLinksv2(activeFile);
		console.log("Outgoing Links:", outgoing);
		const filtered = this.filterIncomingLinks(incoming, outgoing);
		console.log("filtered links: ", filtered)

		if (filtered.length === 0) {
			container.createEl("p", { text: "No filtered backlinks found" });
		} else {
			const list = container.createEl("ul");
			filtered.forEach((file) => {
				console.log("creating link...")
				const listItem = list.createEl("li");
				const link = listItem.createEl("a", {
					text: file.baseName,
					href: "#"
					//href: file.filePath.replace(/\.md$/, ""),
				});
				link.classList.add("internal-link");
				link.dataset.href = file.filePath.replace(/\.md$/, ""); // Required for Obsidian's internal linking

				link.onclick = (event) => {
					event.preventDefault();
					this.app.workspace.openLinkText(file.filePath.replace(/\.ms$/, ""), "", true);
				};
			});
		}
//		container.createEl("p", {text: "testing here"})
//		const linkz = this.getIncomingLinks(activeFile)
//		linkz.forEach((link) =>{
//			container.createEl("p", {text: `${link.source}, links` });
//		})
//		container.createEl("p", {text: "testing2 here"})
//		const linkz = this.getOutgoingLinks(activeFile)
//		linkz.forEach((link) =>{
//			container.createEl("p", {text: `${link.source}, links` });
//		})
	}

	// Function to get backlinks and filter out ones with outgoing links
	getFilteredBacklinks(activeFile: TFile): TFile[] {
		const allFiles = this.app.vault.getMarkdownFiles();
		return allFiles.filter((file) => {
			const metadata = this.app.metadataCache.getFileCache(file);
			const links = metadata?.links?.map((link) => link.link) || [];
			return links;//.includes(activeFile.path);// && links.length === 1;
		});
	}






	getIncomingLinks(activeFile: TFile): { source: TFile; links: string[] }[] {
		if (!activeFile) return [];
		const allFiles = app.vault.getMarkdownFiles();
		const activeFilePath = activeFile.path;
		return allFiles
			.map((file) => {
				const metadata = app.metadataCache.getFileCache(file);
				if (!metadata) return null;
	
				// Get outgoing links from this file
				const links = metadata.links?.map((link) => link.link) || [];

				// Normalize paths
				const normalizedLinks = links.map((link) =>
					link.endsWith(".md") ? link : link + ".md"
				);

				// If this file links to the active file, return it
				if (normalizedLinks.includes(activeFilePath)) {
					console.log("source: ", file)
					console.log(normalizedLinks)
					return { filePath: file.path, baseName: file.basename, links: normalizedLinks };
				}
				return null;
			})
			.filter(Boolean) as { source: TFile; links: string[] }[];
	};

	getIncomingLinksv2(activeFile: TFile): { filePath: string; baseName: string; links: string[] }[] {
		const allFiles = app.vault.getMarkdownFiles();
		const activeFilePath = activeFile.path;
		const activeFileName = activeFile.basename;
		return allFiles
	        .map((file) => {
			    const metadata = app.metadataCache.getFileCache(file);
				if (!metadata) return null;
				const links = metadata.links?.map((link) => link.link) || [];
            
	            // Normalize links: Check if the link matches the active file by full path or just filename
		        const normalizedLinks = links.map((link) =>
			        link.endsWith('.md') ? link : link + '.md'
				);

				const isLinkingToActiveFile = normalizedLinks.includes(activeFilePath) ||
					normalizedLinks.includes(activeFileName + '.md');
				const cleanedLink = file.path.replace(/\.md$/, "");
		        if (isLinkingToActiveFile) {
			        return { filePath: cleanedLink, baseName: file.basename, links: normalizedLinks };
				}
				return null;
		})
        .filter(Boolean) as { filePath: string; links: string[] }[];
	}







//	getOutgoingLinks(activeFile: TFile): string[] {
//		if (!activeFile) return [];
//
//		const metadata = app.metadataCache.getFileCache(activeFile);
//		if (!metadata) return [];
//
//		// Get all outgoing links
//		return metadata.links?.map((link) => link.link) || [];
//	}



	getOutgoingLinks(activeFile: TFile): { filePath: string; baseName: string; links: string[] }[] {
		if (!activeFile) return [];
	
		const metadata = app.metadataCache.getFileCache(activeFile);
		if (!metadata) return [];
	
		// Get all outgoing links from the active file
		const links = metadata.links?.map((link) => link.link) || [];

		// Normalize paths to ensure they are complete paths
		const normalizedLinks = links.map((link) =>
			link.endsWith(".md") ? link : link + ".md"
		);
	
		// Find the full file path for each linked file
		return normalizedLinks.map((link) => {
			const linkedFile = app.vault.getAbstractFileByPath(link);
			return linkedFile && linkedFile instanceof TFile
				? { filePath: linkedFile.path.replace(/\.md$/, ""), baseName: linkedFile.basename, links: [activeFile.path] }
				: null;
		}).filter(Boolean) as { filePath: string; links: string[] }[];
	}





	getOutgoingLinksv2(activeFile: TFile): { filePath: string; baseName: string; links: string[] }[] {
	    if (!activeFile) return [];

		const metadata = app.metadataCache.getFileCache(activeFile);
		if (!metadata) return [];
	
		// Get all outgoing links
		const links = metadata.links?.map((link) => link.link) || [];

		return links
			.map((rawLink) => {
				let fullPath = rawLink.endsWith(".md") ? rawLink : rawLink + ".md";

	            // Try to resolve relative links using Obsidian's metadataCache
		        const linkedFile = app.metadataCache.getFirstLinkpathDest(rawLink, activeFile.path);
	
		        if (linkedFile) {
			        fullPath = linkedFile.path; // Use the correct full path
				}

	            return linkedFile
		            ? { filePath: fullPath.replace(/\.md$/, ""), baseName: linkedFile.basename, links: [activeFile.path] }
			        : null;
			})
			.filter(Boolean) as { filePath: string; baseName: string; links: string[] }[];
	}





	filterIncomingLinks(incomingLinks: { filePath: string; baseName: string, links: string[] }[], outgoingLinks: { filePath: string; baseName: string, links: string[] }[]): { filePath: string; baseName: string, links: string[] }[] {
		// Get a set of file paths from the outgoing links to easily check if incoming links are outgoing
		const outgoingFilePaths = new Set(outgoingLinks.map(link => link.filePath));
	
		// Filter out incoming links whose filePath is in the outgoingFilePaths set
		return incomingLinks.filter(incoming => !outgoingFilePaths.has(incoming.filePath));
	}





}

