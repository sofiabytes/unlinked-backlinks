import { describe, it, expect, vi } from 'vitest';
import { CustomSidebarView } from '../src/SidebarView';

describe('CustomSidebarView Logic', () => {
    const mockApp = {
        workspace: {
            on: vi.fn(),
        },
        vault: {},
        metadataCache: {}
    } as any;

    const mockPlugin = {
        settings: {
            selectedFolders: ['Folder A', 'Folder B/Sub']
        }
    } as any;

    const mockLeaf = {} as any;

    const view = new CustomSidebarView(mockLeaf, mockPlugin);
    view.app = mockApp;

    describe('checkPathIsSubpath', () => {
        it('should return true if file is in folder', () => {
            expect(view.checkPathIsSubpath('Folder A/note.md', 'Folder A')).toBe(true);
        });

        it('should return false if file is not in folder', () => {
            expect(view.checkPathIsSubpath('Folder C/note.md', 'Folder A')).toBe(false);
        });

        it('should return false for partial folder name matches', () => {
            // "Folder A" should not match "Folder AA"
            expect(view.checkPathIsSubpath('Folder AA/note.md', 'Folder A')).toBe(false);
        });
    });

    describe('filterIncomingLinks', () => {
        it('should filter out reciprocal links', () => {
            const incoming = [
                { filePath: 'Note A', baseName: 'Note A', links: [] },
                { filePath: 'Note B', baseName: 'Note B', links: [] }
            ];
            const outgoing = [
                { filePath: 'Note A', baseName: 'Note A', links: [] }
            ];

            const result = view.filterIncomingLinks(incoming, outgoing);
            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('Note B');
        });

        it('should keep links that are not in outgoing', () => {
            const incoming = [
                { filePath: 'Note C', baseName: 'Note C', links: [] }
            ];
            const outgoing = [
                { filePath: 'Note A', baseName: 'Note A', links: [] }
            ];

            const result = view.filterIncomingLinks(incoming, outgoing);
            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('Note C');
        });
    });

    describe('checkPathInFolderList', () => {
        it('should return matching folders', () => {
            const folders = ['A', 'B'];
            expect(view.checkPathInFolderList('A/note.md', folders)).toEqual(['A']);
            expect(view.checkPathInFolderList('C/note.md', folders)).toEqual([]);
        });
    });

    describe('getIncomingLinksv2', () => {
        it('should include links from embeds', () => {
            const activeFile = { path: 'Target.md', basename: 'Target' } as any;
            const mockFile = { path: 'Source.md', basename: 'Source' } as any;

            mockApp.vault.getMarkdownFiles = vi.fn().mockReturnValue([mockFile]);
            mockApp.metadataCache.getFileCache = vi.fn().mockReturnValue({
                embeds: [{ link: 'Target' }]
            });

            const result = view.getIncomingLinksv2(activeFile);
            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('Source');
        });
    });

    describe('getOutgoingLinksv2', () => {
        it('should include links from embeds', () => {
            const activeFile = { path: 'Source.md', basename: 'Source' } as any;
            const linkedFile = { path: 'Target.md', basename: 'Target' } as any;

            mockApp.metadataCache.getFileCache = vi.fn().mockReturnValue({
                embeds: [{ link: 'Target' }]
            });
            mockApp.metadataCache.getFirstLinkpathDest = vi.fn().mockReturnValue(linkedFile);

            const result = view.getOutgoingLinksv2(activeFile);
            expect(result).toHaveLength(1);
            expect(result[0].filePath).toBe('Target');
        });
    });
});
