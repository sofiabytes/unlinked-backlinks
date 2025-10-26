import { ItemView, WorkspaceLeaf, TFile, normalizePath } from "obsidian";
import type MyPlugin from "./main"; // import your plugin type

export const VIEW_TYPE_CUSTOM_SIDEBAR = "filtered-backlinks-sidebar";

export class CustomSidebarView extends ItemView {
	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
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

	checkFileInSettings(activeFile: TFile){
		

		const folderPaths = this.plugin.settings.selectedFolders || [];

		let filePath;
		let matchingFolders;

		if (activeFile) {
			filePath = normalizePath(activeFile.path);

			matchingFolders = folderPaths.filter(folder => {
	        const folderNormalized = normalizePath(folder);
		    return filePath === folderNormalized || filePath.startsWith(folderNormalized + "/");
		});

		console.log("Folders the file is in:", matchingFolders);

		return matchingFolders;

		}
	}


	checkPathIsSubpath(filePath: String, parentPath: String){	
		    return filePath.startsWith(parentPath + "/");
	}

	checkPathInFolderList(path: String, folders: String[]){
		const matchingFolders = folders.filter( f=> {
			return this.checkPathIsSubpath(path, f)
		});
		console.log(matchingFolders);
		return matchingFolders;
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
		console.log(activeFile)

		const matchingFolders = this.checkFileInSettings(activeFile);
		console.log("This file is in the following folders in settings:")
		console.log(matchingFolders)

		// Display the name of the current note
		container.createEl("h3", { text: `Backlinks for ${activeFile.basename}` });

		const incoming = this.getIncomingLinksv2(activeFile);
		console.log("Incoming Links:", incoming);
		const outgoing = this.getOutgoingLinksv2(activeFile);
		console.log("Outgoing Links:", outgoing);
		const matched = this.filterIncomingLinks(incoming, outgoing);
		console.log("filtered links: ", matched)
		
		let filtered;
		if (matchingFolders.length>0){
		filtered = matched.filter( link => {
			console.log("final results")
			console.log(this.checkPathInFolderList(normalizePath(link.filePath), matchingFolders).length)
			console.log(this.checkPathInFolderList(normalizePath(link.filePath), matchingFolders).length>0)
			return this.checkPathInFolderList(normalizePath(link.filePath), matchingFolders).length>0
		});
		console.log("MATCHED", filtered);}
		else {
			filtered = matched;
		}

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
				const bodyLinks = metadata.links?.map((link) => link.link) || [];
				// Get links from the frontmatter
				const frontmatterLinks = metadata.frontmatterLinks?.map((link) => link.link) || [];

				// Combine both sets of links
				const allLinks = [...frontmatterLinks, ...bodyLinks];

	            // Normalize links: Check if the link matches the active file by full path or just filename
		        const normalizedLinks = allLinks.map((link) =>
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
		//const links = metadata.links?.map((link) => link.link) || [];

		// Get links from the frontmatter
		const frontmatterLinks = metadata.frontmatterLinks?.map((link) => link.link) || [];
		//console.log("metadata")
		//console.log(metadata.frontmatterLinks)
	
		// Get links from the body of the file
		const bodyLinks = metadata.links?.map((link) => link.link) || [];

		// Combine both sets of links
		const allLinks = [...frontmatterLinks, ...bodyLinks];

		return allLinks
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

