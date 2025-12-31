import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeContext } from '../ThemeProvider';
import { Edit2, Save, X, Download, Trash2, Plus, Send, Search, GripVertical, ListMusic } from 'lucide-react';
import { supabase, Song as SupabaseSong, Note, CustomSetlist, CustomSetlistSong } from '../lib/supabase';

const SETLIST_STORAGE_KEY = 'setlist_content';
const SETLIST_PASSWORD_HASH_KEY = 'setlist_password_hash';
const SETLIST_USER_KEY = 'setlist_user';

// Default setlist content (only used if localStorage is empty)
const DEFAULT_SETLIST = `# Master Setlist (51 Songs)

## 🕺 Dance / Funk / Pop
- Uptown Funk — Bruno Mars  
- Get Lucky — Daft Punk  
- This Is How We Do It — Montell Jordan  
- Moves Like Jagger — Maroon 5  
- Billie Jean — Michael Jackson  
- Superstition — Stevie Wonder  
- Play That Funky Music — Wild Cherry  
- Let's Dance — David Bowie  
- Listen to the Music — The Doobie Brothers  
- Juice — Lizzo  
- Cold Heart — Elton John & Dua Lipa  
- Semi-Charmed Life — Third Eye Blind  

## 🎸 Classic Rock / Hard Rock
- Crazy Train — Ozzy Osbourne  
- Black Dog — Led Zeppelin  
- Enter Sandman — Metallica  
- Limelight — Rush  
- Working Man — Rush  
- Carry On Wayward Son — Kansas  
- Eminence Front — The Who  
- Johnny B. Goode — Chuck Berry  

## 🎸 Alt / Grunge / 90s Rock
- Seven Nation Army — The White Stripes  
- Rooster — Alice In Chains  
- Plush — Stone Temple Pilots  
- Hunger Strike — Temple of the Dog  
- Self Esteem — The Offspring  
- Push — Matchbox Twenty  
- Love Song — The Cure  

## 🎸 Classic / Southern / Blues Rock
- Simple Man — Lynyrd Skynyrd  
- Sweet Home Alabama — Lynyrd Skynyrd  
- Mary Jane's Last Dance — Tom Petty & the Heartbreakers  
- Beast of Burden — The Rolling Stones  
- Prisoner — Joe Bonamassa  

## 🎶 Soul / R&B / Power Ballad
- Purple Rain — Prince  

## 🎶 Pop / New Wave / Alt Pop
- Ordinary World — Duran Duran  
- Day Tripper — The Beatles  

## 🤠 Country
- Chattahoochee — Alan Jackson  
- Low Places — Garth Brooks  
- Any Man of Mine — Shania Twain  
- Last Night — Morgan Wallen  

## 🎼 Originals
- Call It Love — Original  
- 6 Feet — Original  
`;

export const Setlist: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'preview' | 'crud'>('preview');
  const [editingItem, setEditingItem] = useState<{section: string, index: number, song: string, artist: string, originalSong: string, originalArtist: string} | null>(null);
  const [deletingItem, setDeletingItem] = useState<{section: string, index: number, song: string, artist: string} | null>(null);
  const [newSong, setNewSong] = useState({ section: '', song: '', artist: '' });
  const useDB = true; // Always use database
  const [dbLoading, setDbLoading] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<'Collin' | 'Leif' | 'Ryland' | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'genre'>('alphabetical');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderSongs, setBuilderSongs] = useState<{section: string, song: string, artist: string, id: string}[]>([]);
  const [customSetlists, setCustomSetlists] = useState<CustomSetlist[]>([]);
  const [currentSetlistId, setCurrentSetlistId] = useState<number | null>(null);
  const [setlistName, setSetlistName] = useState('');
  const [draggedItem, setDraggedItem] = useState<{section: string, song: string, artist: string, id: string} | null>(null);
  const [newBuilderSong, setNewBuilderSong] = useState({ section: '', song: '', artist: '' });
  const [newBuilderSectionName, setNewBuilderSectionName] = useState('');
  const [builderEditMode, setBuilderEditMode] = useState(true);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [draggedMasterSong, setDraggedMasterSong] = useState<{section: string, index: number} | null>(null);
  const [showActualOrderView, setShowActualOrderView] = useState(false);
  const [masterSongs, setMasterSongs] = useState<SupabaseSong[]>([]);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const notesFetchInProgressRef = useRef(false);
  const pendingNotesScrollBehaviorRef = useRef<ScrollBehavior | null>(null);

  // Hash function using Web Crypto API
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Check if already authenticated (check localStorage hash)
  useEffect(() => {
    const checkAuthentication = async () => {
      const storedHash = localStorage.getItem(SETLIST_PASSWORD_HASH_KEY);
      const storedUser = localStorage.getItem(SETLIST_USER_KEY) as 'Collin' | 'Leif' | 'Ryland' | null;
      const correctPassword = process.env.REACT_APP_SET_LIST_PASSWORD;
      
      if (!correctPassword) {
        // No password configured, show error
        setError('Password not configured. Please set REACT_APP_SET_LIST_PASSWORD in your .env file.');
        return;
      }

      if (storedHash) {
        // Hash exists, compare with current password
        try {
          const currentPasswordHash = await hashPassword(correctPassword);
          if (storedHash === currentPasswordHash) {
            // Hashes match, user is authenticated
            setIsAuthenticated(true);
            setShowPasswordDialog(false);
            
            // Check if user is already selected
            // Functions will be called by useEffect hooks after they're defined
            if (storedUser && ['Collin', 'Leif', 'Ryland'].includes(storedUser)) {
              setSelectedUser(storedUser);
            } else {
              // Show user selection dialog
              setShowUserDialog(true);
            }
            return;
          }
        } catch (err) {
          console.error('Error comparing password hash:', err);
        }
      }
      
      // No hash stored or hash doesn't match, show password dialog
      setShowPasswordDialog(true);
    };

    checkAuthentication();
  }, []);


  // Supabase functions
  const loadSetlistFromLocal = useCallback(() => {
    const savedContent = localStorage.getItem(SETLIST_STORAGE_KEY);
    if (savedContent) {
      setMarkdown(savedContent);
      setEditContent(savedContent);
      return;
    }
    setMarkdown(DEFAULT_SETLIST);
    setEditContent(DEFAULT_SETLIST);
    localStorage.setItem(SETLIST_STORAGE_KEY, DEFAULT_SETLIST);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // DEFAULT_SETLIST is a constant outside component, doesn't need to be in deps

  const loadSetlistFromDB = useCallback(async () => {
    setDbLoading(true);
    try {
      // Fetch all songs ordered by global master_order (falls back if column isn't present yet)
      let songs: SupabaseSong[] | null = null;
      {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .order('master_order', { ascending: true })
          .order('id', { ascending: true });

        if (!error) {
          songs = data as SupabaseSong[] | null;
        } else {
          // Fallback for older schemas (no master_order yet)
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('songs')
            .select('*')
            .order('section', { ascending: true })
            .order('order_index', { ascending: true })
            .order('id', { ascending: true });

          if (fallbackError) throw fallbackError;
          songs = fallbackData as SupabaseSong[] | null;
        }
      }

      setMasterSongs(songs || []);

      // Group songs by section, preserving *section order as encountered* in master order
      const sectionsMap = new Map<string, { song: string; artist: string }[]>();
      const sectionOrder: string[] = [];
      (songs || []).forEach((song: SupabaseSong) => {
        if (!sectionsMap.has(song.section)) {
          sectionsMap.set(song.section, []);
          sectionOrder.push(song.section);
        }
        sectionsMap.get(song.section)!.push({
          song: song.song,
          artist: song.artist,
        });
      });

      // Convert to markdown format (keep bullet format so parseMarkdown works)
      let md = '';
      sectionOrder.forEach((sectionTitle) => {
        const songsForSection = sectionsMap.get(sectionTitle) || [];
        md += `## ${sectionTitle}\n`;
        songsForSection.forEach(s => {
          md += `- ${s.song} — ${s.artist}  \n`;
        });
        md += '\n';
      });

      const markdownContent = md.trim() || DEFAULT_SETLIST;
      setMarkdown(markdownContent);
      setEditContent(markdownContent);
    } catch (err) {
      console.error('Error loading from Supabase:', err);
      setError('Failed to load from database. Falling back to local storage.');
      setMasterSongs([]);
      loadSetlistFromLocal();
    } finally {
      setDbLoading(false);
    }
  }, [loadSetlistFromLocal]);

  // Load setlist from localStorage or DB based on toggle
  const loadSetlist = useCallback(async () => {
    if (useDB) {
      await loadSetlistFromDB();
    } else {
      loadSetlistFromLocal();
    }
  }, [useDB, loadSetlistFromDB, loadSetlistFromLocal]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.REACT_APP_SET_LIST_PASSWORD;
    
    if (!correctPassword) {
      setError('Password not configured. Please set REACT_APP_SET_LIST_PASSWORD in your .env file.');
      return;
    }

    if (password === correctPassword) {
      // Hash the password and store it in localStorage
      try {
        const passwordHash = await hashPassword(correctPassword);
        localStorage.setItem(SETLIST_PASSWORD_HASH_KEY, passwordHash);
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        
        // Check if user is already selected
        const storedUser = localStorage.getItem(SETLIST_USER_KEY) as 'Collin' | 'Leif' | 'Ryland' | null;
        if (storedUser && ['Collin', 'Leif', 'Ryland'].includes(storedUser)) {
          setSelectedUser(storedUser);
          loadSetlist();
          loadNotes();
        } else {
          // Show user selection dialog
          setShowUserDialog(true);
        }
      } catch (err) {
        console.error('Error hashing password:', err);
        setError('Error processing password. Please try again.');
      }
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleUserSelect = (user: 'Collin' | 'Leif' | 'Ryland') => {
    setSelectedUser(user);
    localStorage.setItem(SETLIST_USER_KEY, user);
    setShowUserDialog(false);
    loadSetlist();
    loadNotes();
  };

  const isNotesAtBottom = useCallback((): boolean => {
    const container = notesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop <= container.clientHeight + 10; // 10px threshold
  }, []);

  const scrollNotesToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = notesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const loadNotes = useCallback(async (options?: { scroll?: 'never' | 'if-at-bottom' | 'always'; scrollBehavior?: ScrollBehavior }) => {
    // Prevent overlapping calls - if a fetch is already in progress, skip this one
    if (notesFetchInProgressRef.current) {
      return;
    }

    const scrollMode = options?.scroll ?? 'never';
    const scrollBehavior = options?.scrollBehavior ?? 'auto';
    const wasAtBottom = isNotesAtBottom();
    const shouldScrollAfterLoad =
      scrollMode === 'always' || (scrollMode === 'if-at-bottom' && wasAtBottom);

    notesFetchInProgressRef.current = true;
    
    if (isMountedRef.current) {
      setNotesLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setNotes(data || []);
        pendingNotesScrollBehaviorRef.current = shouldScrollAfterLoad ? scrollBehavior : null;
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      if (isMountedRef.current) {
        setError('Failed to load notes.');
      }
    } finally {
      notesFetchInProgressRef.current = false;
      if (isMountedRef.current) {
        setNotesLoading(false);
      }
    }
  }, [isNotesAtBottom]);

  // Load custom setlists
  const loadCustomSetlists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_setlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomSetlists(data || []);
    } catch (err) {
      console.error('Error loading custom setlists:', err);
    }
  }, []);

  // Load a custom setlist
  const loadCustomSetlist = useCallback(async (setlistId: number) => {
    try {
      const { data: songs, error } = await supabase
        .from('custom_setlist_songs')
        .select('*')
        .eq('setlist_id', setlistId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const loadedSongs = (songs || []).map((song) => ({
        section: song.section,
        song: song.song,
        artist: song.artist,
        id: `${song.section}-${song.song}-${song.artist}-${song.id}`
      }));

      setBuilderSongs(loadedSongs);
      setCurrentSetlistId(setlistId);
      setBuilderEditMode(false); // Start in view mode when loading existing setlist
      
      // Get setlist name
      const { data: setlist } = await supabase
        .from('custom_setlists')
        .select('name')
        .eq('id', setlistId)
        .single();
      
      if (setlist) {
        setSetlistName(setlist.name);
      }
    } catch (err) {
      console.error('Error loading custom setlist:', err);
      setError('Failed to load setlist.');
    }
  }, []);

  // Save current builder as a custom setlist
  const saveCustomSetlist = useCallback(async () => {
    if (!setlistName.trim()) {
      setError('Please enter a name for the setlist.');
      return;
    }

    try {
      let finalSetlistId = currentSetlistId;

      if (currentSetlistId) {
        // Update existing setlist
        const { error: updateError } = await supabase
          .from('custom_setlists')
          .update({ name: setlistName.trim() })
          .eq('id', currentSetlistId);

        if (updateError) throw updateError;

        // Delete existing songs
        const { error: deleteError } = await supabase
          .from('custom_setlist_songs')
          .delete()
          .eq('setlist_id', currentSetlistId);

        if (deleteError) throw deleteError;
        finalSetlistId = currentSetlistId;
      } else {
        // Create new setlist
        const { data: newSetlist, error: insertError } = await supabase
          .from('custom_setlists')
          .insert({ name: setlistName.trim() })
          .select()
          .single();

        if (insertError) throw insertError;
        finalSetlistId = newSetlist.id;
        setCurrentSetlistId(newSetlist.id);
      }

      // Insert songs
      const songsToInsert: Omit<CustomSetlistSong, 'id' | 'created_at'>[] = builderSongs.map((song, index) => ({
        setlist_id: finalSetlistId!,
        section: song.section,
        song: song.song,
        artist: song.artist,
        order_index: index
      }));

      if (songsToInsert.length > 0) {
        const { error: songsError } = await supabase
          .from('custom_setlist_songs')
          .insert(songsToInsert);

        if (songsError) throw songsError;
      }

      await loadCustomSetlists();
      setError('');
      setShowSaveConfirm(false); // Close confirmation dialog
      setBuilderEditMode(false); // Switch to view mode after saving
    } catch (err) {
      console.error('Error saving custom setlist:', err);
      setError('Failed to save setlist.');
      setShowSaveConfirm(false); // Close dialog even on error
    }
  }, [setlistName, builderSongs, currentSetlistId, loadCustomSetlists]);

  // Delete a custom setlist
  const deleteCustomSetlist = useCallback(async (setlistId: number) => {
    try {
      const { error } = await supabase
        .from('custom_setlists')
        .delete()
        .eq('id', setlistId);

      if (error) throw error;
      await loadCustomSetlists();
      
      if (currentSetlistId === setlistId) {
        setCurrentSetlistId(null);
        setSetlistName('');
        setBuilderSongs([]);
      }
    } catch (err) {
      console.error('Error deleting custom setlist:', err);
      setError('Failed to delete setlist.');
    }
  }, [currentSetlistId, loadCustomSetlists]);

  // Load setlist when authenticated and user is selected
  useEffect(() => {
    if (isAuthenticated && selectedUser) {
      loadSetlist();
      loadCustomSetlists();
    }
  }, [isAuthenticated, selectedUser, loadSetlist, loadCustomSetlists]);

  // Initialize builder with all songs when builder is opened
  useEffect(() => {
    if (showBuilder && builderSongs.length === 0 && markdown) {
      const sections = parseMarkdown(markdown);
      const allSongs: {section: string, song: string, artist: string, id: string}[] = [];
      sections.forEach((section) => {
        section.songs.forEach((song) => {
          allSongs.push({
            section: section.title,
            song: song.song,
            artist: song.artist,
            id: `${section.title}-${song.song}-${song.artist}-${Date.now()}-${Math.random()}`
          });
        });
      });
      setBuilderSongs(allSongs);
    }
  }, [showBuilder, markdown]);

  // Load notes when authenticated and user is selected
  useEffect(() => {
    if (isAuthenticated && selectedUser) {
      loadNotes({ scroll: 'never' });
      // Set up real-time subscription for notes
      const notesSubscription = supabase
        .channel('notes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notes' },
          () => {
            loadNotes({ scroll: 'if-at-bottom', scrollBehavior: 'smooth' });
          }
        )
        .subscribe();

      return () => {
        notesSubscription.unsubscribe();
      };
    }
  }, [isAuthenticated, selectedUser, loadNotes]);

  // Set up interval to refresh notes every 1 minute
  useEffect(() => {
    if (isAuthenticated && selectedUser) {
      // Refresh notes every 60 seconds (1 minute)
      const intervalId = setInterval(() => {
        // Only refresh if component is still mounted and no fetch in progress
        if (isMountedRef.current && !notesFetchInProgressRef.current) {
          loadNotes({ scroll: 'never' });
        }
      }, 60000); // 60000ms = 1 minute

      // Cleanup interval on unmount or when dependencies change
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isAuthenticated, selectedUser, loadNotes]);

  // Track mounted state for safe state updates
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Apply any pending container-only scroll after notes render (never scroll the whole page)
  useEffect(() => {
    const behavior = pendingNotesScrollBehaviorRef.current;
    if (!behavior) return;
    pendingNotesScrollBehaviorRef.current = null;
    requestAnimationFrame(() => scrollNotesToBottom(behavior));
  }, [notes, scrollNotesToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_name: selectedUser,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
      // Reload notes immediately to show the new message
      await loadNotes({ scroll: 'always', scrollBehavior: 'smooth' });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  };

  const handleSaveToDB = async () => {
    setDbLoading(true);
    try {
      // Parse the markdown and sync to database
      const sections = parseMarkdown(editContent);
      
      // Delete all existing songs
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .neq('id', 0); // Delete all

      if (deleteError) throw deleteError;

      // Insert all songs from markdown
      const songsToInsert: Omit<SupabaseSong, 'id' | 'created_at' | 'updated_at'>[] = [];
      sections.forEach((section) => {
        section.songs.forEach((song, index) => {
          songsToInsert.push({
            section: section.title,
            song: song.song,
            artist: song.artist,
            order_index: index
          });
        });
      });

      if (songsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('songs')
          .insert(songsToInsert);

        if (insertError) throw insertError;
      }

      setMarkdown(editContent);
      setIsEditing(false);
      await loadSetlistFromDB();
    } catch (err) {
      console.error('Error saving to DB:', err);
      setError('Failed to save to database.');
    } finally {
      setDbLoading(false);
    }
  };

  const handleSave = async () => {
    if (useDB) {
      await handleSaveToDB();
    } else {
      setMarkdown(editContent);
      localStorage.setItem(SETLIST_STORAGE_KEY, editContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(markdown);
    setIsEditing(false);
  };

  const handleDownload = () => {
    // Create a blob with the markdown content
    const blob = new Blob([markdown], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'setlist.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCustomSetlist = () => {
    if (builderSongs.length === 0) return;
    
    // Convert builder songs to markdown format
    const sectionsMap = new Map<string, { song: string; artist: string }[]>();
    builderSongs.forEach((song) => {
      if (!sectionsMap.has(song.section)) {
        sectionsMap.set(song.section, []);
      }
      sectionsMap.get(song.section)!.push({ song: song.song, artist: song.artist });
    });

    let md = `# ${setlistName || 'Custom Setlist'}\n\n`;
    sectionsMap.forEach((songs, sectionTitle) => {
      md += `## ${sectionTitle}\n`;
      songs.forEach(s => {
        md += `- ${s.song} — ${s.artist}  \n`;
      });
      md += '\n';
    });

    const blob = new Blob([md.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(setlistName || 'custom-setlist').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse markdown into structured data
  type Song = { song: string; artist: string };
  type Section = { title: string; songs: Song[] };
  
  const parseMarkdown = (md: string): Section[] => {
    const sections: Section[] = [];
    const lines = md.split('\n');
    let currentSection: Section | null = null;

    for (const line of lines) {
      // Check for section header (##)
      const sectionMatch = line.match(/^##\s+(.+)$/);
      if (sectionMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: sectionMatch[1].trim(), songs: [] };
        continue;
      }

      // Check for list item (song)
      // Supports both:
      // - "- Song — Artist"
      // - "1. Song — Artist"
      const songMatch = line.match(/^(?:-\s+|\d+\.\s+)(.+?)\s*[—–-]\s*(.+)$/);
      if (songMatch && currentSection) {
        currentSection.songs.push({
          song: songMatch[1].trim(),
          artist: songMatch[2].trim()
        });
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  // Convert structured data back to markdown
  const sectionsToMarkdown = (sections: Section[]): string => {
    let md = '';
    for (const section of sections) {
      md += `## ${section.title}\n`;
      for (const song of section.songs) {
        md += `- ${song.song} — ${song.artist}  \n`;
      }
      md += '\n';
    }
    return md.trim();
  };

  // Filter sections based on search query
  const getFilteredSections = useCallback((sections: Section[], query: string): Section[] => {
    if (!query.trim()) {
      return sections;
    }

    const queryLower = query.toLowerCase().trim();
    const filtered: Section[] = [];

    sections.forEach((section) => {
      const matchesSection = section.title.toLowerCase().includes(queryLower);
      const filteredSongs = section.songs.filter((song) => {
        const matchesSong = song.song.toLowerCase().includes(queryLower);
        const matchesArtist = song.artist.toLowerCase().includes(queryLower);
        return matchesSong || matchesArtist;
      });

      // Include section if it matches or has matching songs
      if (matchesSection || filteredSongs.length > 0) {
        filtered.push({
          title: section.title,
          songs: matchesSection ? section.songs : filteredSongs
        });
      }
    });

    return filtered;
  }, []);

  // Sort sections based on sort options
  const getSortedSections = useCallback((sections: Section[]): Section[] => {
    const sorted = [...sections];

    if (sortBy === 'genre') {
      sorted.sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else if (sortBy === 'alphabetical') {
      // Flatten all songs with their sections, sort, then regroup
      const allSongs: { section: string; song: string; artist: string }[] = [];
      sorted.forEach((section) => {
        section.songs.forEach((song) => {
          allSongs.push({
            section: section.title,
            song: song.song,
            artist: song.artist
          });
        });
      });

      allSongs.sort((a, b) => {
        const comparison = a.song.localeCompare(b.song);
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      // Regroup by section
      const sectionMap = new Map<string, Section>();
      allSongs.forEach((item) => {
        if (!sectionMap.has(item.section)) {
          sectionMap.set(item.section, { title: item.section, songs: [] });
        }
        sectionMap.get(item.section)!.songs.push({
          song: item.song,
          artist: item.artist
        });
      });

      return Array.from(sectionMap.values());
    }

    return sorted;
  }, [sortBy, sortDirection]);

  const resetSearchAndSort = useCallback(() => {
    setShowSearch(false);
    setSearchQuery('');
    setSortBy('alphabetical');
    setSortDirection('asc');
  }, []);

  const getActualOrderItems = useCallback((): { song: string; artist: string; section: string }[] => {
    if (masterSongs && masterSongs.length > 0) {
      return masterSongs.map((s) => ({
        song: s.song,
        artist: s.artist,
        section: s.section,
      }));
    }

    // Fallback: derive from markdown order (sections as written, then songs in section)
    const sections = parseMarkdown(markdown);
    const items: { song: string; artist: string; section: string }[] = [];
    sections.forEach((section) => {
      section.songs.forEach((s) => items.push({ song: s.song, artist: s.artist, section: section.title }));
    });
    return items;
  }, [masterSongs, markdown]);

  // Get sections in their original order (from database)
  const getOriginalSections = useCallback((): Section[] => {
    return parseMarkdown(markdown);
  }, [markdown]);

  // Get filtered and sorted markdown for display
  const getFilteredMarkdown = useCallback((): string => {
    const sections = parseMarkdown(markdown);
    const filteredSections = getFilteredSections(sections, searchQuery);
    // Only apply sorting if there's a search query or sort is not default
    const shouldSort = searchQuery.trim() || sortBy !== 'alphabetical' || sortDirection !== 'asc';
    const finalSections = shouldSort ? getSortedSections(filteredSections) : filteredSections;
    return sectionsToMarkdown(finalSections);
  }, [markdown, searchQuery, sortBy, sortDirection, getFilteredSections, getSortedSections]);

  // Get filtered and sorted sections for CRUD view
  const getDisplaySections = useCallback((): Section[] => {
    const sections = parseMarkdown(markdown);
    const filteredSections = getFilteredSections(sections, searchQuery);
    // Only apply sorting if there's a search query or sort is not default
    const shouldSort = searchQuery.trim() || sortBy !== 'alphabetical' || sortDirection !== 'asc';
    return shouldSort ? getSortedSections(filteredSections) : filteredSections;
  }, [markdown, searchQuery, sortBy, sortDirection, getFilteredSections, getSortedSections]);

  // CRUD operations
  const [newSectionName, setNewSectionName] = useState('');
  
  const handleAddSongToDB = async (sectionTitle: string, song: string, artist: string) => {
    try {
      // Get max order_index for this section
      const { data: existingSongs } = await supabase
        .from('songs')
        .select('order_index')
        .eq('section', sectionTitle)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrder = existingSongs && existingSongs.length > 0 
        ? existingSongs[0].order_index + 1 
        : 0;

      const { error } = await supabase
        .from('songs')
        .insert({
          section: sectionTitle,
          song,
          artist,
          order_index: nextOrder
        });

      if (error) throw error;
      await loadSetlistFromDB();
    } catch (err) {
      console.error('Error adding song to DB:', err);
      setError('Failed to add song to database.');
    }
  };

  const handleAddSong = async () => {
    const sectionTitle = newSong.section === '__NEW__' ? newSectionName : newSong.section;
    if (!sectionTitle || !newSong.song || !newSong.artist) return;
    
    if (useDB) {
      await handleAddSongToDB(sectionTitle, newSong.song, newSong.artist);
    } else {
      const sections = parseMarkdown(markdown);
      const section = sections.find(s => s.title === sectionTitle);
      
      if (section) {
        section.songs.push({ song: newSong.song, artist: newSong.artist });
      } else {
        sections.push({
          title: sectionTitle,
          songs: [{ song: newSong.song, artist: newSong.artist }]
        });
      }
      
      const newMarkdown = sectionsToMarkdown(sections);
      setMarkdown(newMarkdown);
      setEditContent(newMarkdown);
      localStorage.setItem(SETLIST_STORAGE_KEY, newMarkdown);
    }
    
    setNewSong({ section: '', song: '', artist: '' });
    setNewSectionName('');
  };

  const handleEditSong = (sectionTitle: string, index: number, song: string, artist: string) => {
    setEditingItem({ section: sectionTitle, index, song, artist, originalSong: song, originalArtist: artist });
  };

  const handleSaveEditToDB = async () => {
    if (!editingItem) return;
    
    setDbLoading(true);
    try {
      // Check if database is empty - if so, save current setlist first
      const { data: existingSongs, error: checkError } = await supabase
        .from('songs')
        .select('id')
        .limit(1);

      if (checkError) throw checkError;

      if (!existingSongs || existingSongs.length === 0) {
        // Database is empty, save the current markdown to database first
        const sections = parseMarkdown(markdown);
        const songsToInsert: Omit<SupabaseSong, 'id' | 'created_at' | 'updated_at'>[] = [];
        
        sections.forEach((section) => {
          section.songs.forEach((song, index) => {
            songsToInsert.push({
              section: section.title,
              song: song.song,
              artist: song.artist,
              order_index: index
            });
          });
        });

        if (songsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('songs')
            .insert(songsToInsert);

          if (insertError) throw insertError;
        }
      }

      // Now find and update the song
      const searchSong = editingItem.originalSong.trim();
      const searchArtist = editingItem.originalArtist.trim();

      // First try exact match
      let { data: songsByContent, error: fetchError } = await supabase
        .from('songs')
        .select('id, song, artist')
        .eq('song', searchSong)
        .eq('artist', searchArtist)
        .limit(5);

      if (fetchError) throw fetchError;

      // If no exact match, try case-insensitive
      if (!songsByContent || songsByContent.length === 0) {
        const { data: allSongs } = await supabase
          .from('songs')
          .select('id, song, artist')
          .limit(100);

        if (allSongs) {
          songsByContent = allSongs.filter(s => 
            s.song.trim().toLowerCase() === searchSong.toLowerCase() &&
            s.artist.trim().toLowerCase() === searchArtist.toLowerCase()
          );
        }
      }

      if (!songsByContent || songsByContent.length === 0) {
        throw new Error(`Could not find song: "${searchSong}" by ${searchArtist}`);
      }

      const songId = songsByContent[0].id;
      if (!songId) {
        throw new Error('Song ID not found');
      }

      const { error: updateError } = await supabase
        .from('songs')
        .update({
          song: editingItem.song.trim(),
          artist: editingItem.artist.trim()
        })
        .eq('id', songId);

      if (updateError) throw updateError;
      
      await loadSetlistFromDB();
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating song in DB:', err);
      setError(err instanceof Error ? err.message : 'Failed to update song in database.');
    } finally {
      setDbLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    if (useDB) {
      await handleSaveEditToDB();
    } else {
      const sections = parseMarkdown(markdown);
      const section = sections.find(s => s.title === editingItem.section);
      
      if (section && section.songs[editingItem.index]) {
        section.songs[editingItem.index] = {
          song: editingItem.song,
          artist: editingItem.artist
        };
        
        const newMarkdown = sectionsToMarkdown(sections);
        setMarkdown(newMarkdown);
        setEditContent(newMarkdown);
        localStorage.setItem(SETLIST_STORAGE_KEY, newMarkdown);
        setEditingItem(null);
      }
    }
  };

  const handleDeleteSongFromDB = async (sectionTitle: string, index: number) => {
    try {
      // Get the song ID from the database
      const { data: songs } = await supabase
        .from('songs')
        .select('id')
        .eq('section', sectionTitle)
        .order('order_index', { ascending: true });

      if (songs && songs[index]) {
        const { error } = await supabase
          .from('songs')
          .delete()
          .eq('id', songs[index].id);

        if (error) throw error;
        await loadSetlistFromDB();
      }
    } catch (err) {
      console.error('Error deleting song from DB:', err);
      setError('Failed to delete song from database.');
    }
  };

  // Handle drag and drop reordering for master setlist
  const handleReorderMasterSong = async (sectionTitle: string, fromIndex: number, toIndex: number) => {
    try {
      // Get all songs in the section
      const { data: songs, error: fetchError } = await supabase
        .from('songs')
        .select('*')
        .eq('section', sectionTitle)
        .order('order_index', { ascending: true });

      if (fetchError) throw fetchError;
      if (!songs || songs.length === 0) return;

      // Reorder the array
      const reorderedSongs = [...songs];
      const [movedSong] = reorderedSongs.splice(fromIndex, 1);
      reorderedSongs.splice(toIndex, 0, movedSong);

      // Update order_index for all songs in the section
      const updates = reorderedSongs.map((song, index) => ({
        id: song.id,
        order_index: index
      }));

      // Update all songs
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('songs')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      await loadSetlistFromDB();
    } catch (err) {
      console.error('Error reordering song:', err);
      setError('Failed to reorder song.');
    }
  };

  const handleDeleteSong = async (sectionTitle: string, index: number) => {
    if (useDB) {
      await handleDeleteSongFromDB(sectionTitle, index);
    } else {
      const sections = parseMarkdown(markdown);
      const section = sections.find(s => s.title === sectionTitle);
      
      if (section && section.songs[index]) {
        section.songs.splice(index, 1);
        
        // Remove section if empty
        if (section.songs.length === 0) {
          const sectionIndex = sections.findIndex(s => s.title === sectionTitle);
          if (sectionIndex !== -1) {
            sections.splice(sectionIndex, 1);
          }
        }
        
        const newMarkdown = sectionsToMarkdown(sections);
        setMarkdown(newMarkdown);
        setEditContent(newMarkdown);
        localStorage.setItem(SETLIST_STORAGE_KEY, newMarkdown);
      }
    }
    setDeletingItem(null);
  };

  const handleDeleteClick = (sectionTitle: string, index: number, song: string, artist: string) => {
    setDeletingItem({ section: sectionTitle, index, song, artist });
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await handleDeleteSong(deletingItem.section, deletingItem.index);
    }
  };

  // Helper function to extract text content from React children
  const extractText = (children: any): string => {
    if (typeof children === 'string') {
      return children;
    }
    if (typeof children === 'number') {
      return String(children);
    }
    if (Array.isArray(children)) {
      return children.map(extractText).join('');
    }
    if (children && typeof children === 'object' && children.props) {
      return extractText(children.props.children);
    }
    return '';
  };

  // Helper function to create Google search URL for song lyrics
  const createLyricsSearchUrl = (songText: string): string => {
    // Extract song name (everything before the "—" or "-")
    const songName = songText.split(/[—–-]/)[0].trim();
    const searchQuery = encodeURIComponent(`${songName} lyrics`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  const createChordsSearchUrl = (songText: string): string => {
    const parts = songText.split(/[—–-]/).map((p) => p.trim()).filter(Boolean);
    const songName = parts[0] || '';
    const artistName = parts.slice(1).join(' ');
    const searchQuery = encodeURIComponent(
      artistName ? `${songName} ${artistName} chords` : `${songName} chords`
    );
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  // Custom components for ReactMarkdown to make songs clickable
  const markdownComponents = {
    li: ({ children, ...props }: any) => {
      const fullText = extractText(children);
      
      // Check if this looks like a song entry (contains "—" or "-" separator)
      if (fullText && (fullText.includes('—') || fullText.includes('–') || fullText.match(/^[^-]+\s*-\s*/))) {
        const songName = fullText.split(/[—–-]/)[0].trim();
        if (songName) {
          const searchUrl = createLyricsSearchUrl(fullText);
          const chordsUrl = createChordsSearchUrl(fullText);
          return (
            <li {...props}>
              <span className="inline-flex items-baseline gap-2">
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {children}
                </a>
                <a
                  href={chordsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs opacity-70 hover:opacity-100"
                  aria-label={`Chords search for ${songName}`}
                  title="Chords"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  ~
                </a>
              </span>
            </li>
          );
        }
      }
      return <li {...props}>{children}</li>;
    },
  };

  if (!isAuthenticated) {
    return (
      <Transition appear show={showPasswordDialog} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => {}}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-50" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}>
                <Dialog.Title as="h3" className={`text-lg font-medium leading-6 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Enter Password
                </Dialog.Title>
                <form onSubmit={handlePasswordSubmit} className="mt-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Password"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                  <div className="mt-4">
                    <button
                      type="submit"
                      className={`w-full px-4 py-2 rounded-lg font-medium ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } transition-colors`}
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // User selection dialog
  if (isAuthenticated && !selectedUser) {
    return (
      <Transition appear show={showUserDialog} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => {}}>
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-50" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
              }`}>
                <Dialog.Title as="h3" className={`text-lg font-medium leading-6 mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Who are you?
                </Dialog.Title>
                <div className="space-y-2">
                  {(['Collin', 'Leif', 'Ryland'] as const).map((user) => (
                    <button
                      key={user}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {user}
                    </button>
                  ))}
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    );
  }

  return (
    <>
      <div className={`min-h-screen p-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="max-w-4xl mx-auto">
        {error && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-red-900/50 border border-red-700' : 'bg-red-100 border border-red-300'}`}>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            <button
              onClick={() => setError('')}
              className={`mt-2 text-xs ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-3xl font-bold">
            {showBuilder && currentSetlistId ? setlistName || 'Custom Setlist' : 'Setlist'}
          </h1>
          {!isEditing ? (
            <div className="flex flex-wrap gap-2 items-center sm:justify-end">
              {showBuilder && currentSetlistId ? (
                // Custom Setlist View - Show custom setlist buttons
                <>
                  <button
                    onClick={() => {
                      setShowBuilder(false);
                      setCurrentSetlistId(null);
                      setSetlistName('');
                      setBuilderSongs([]);
                      setBuilderEditMode(true);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-400 hover:bg-gray-500 text-white'
                    }`}
                  >
                    <X size={18} />
                    Back to Master
                  </button>
                  <button
                    onClick={handleDownloadCustomSetlist}
                    disabled={builderSongs.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-400 hover:bg-gray-500 text-white'
                    }`}
                  >
                    <Download size={18} />
                    Download
                  </button>
                </>
              ) : (
                // Master Setlist View - Show regular buttons
                <>
                  {dbLoading && (
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
                  )}
                  <button
                    onClick={() => setShowBuilder(!showBuilder)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? showBuilder
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                        : showBuilder
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-400 hover:bg-gray-500 text-white'
                    }`}
                  >
                    <ListMusic size={18} />
                    {showBuilder ? 'Master List' : 'Builder'}
                  </button>
                  {viewMode === 'preview' && (
                    <button
                      onClick={() => {
                        if (!showActualOrderView) {
                          resetSearchAndSort();
                          setShowActualOrderView(true);
                        } else {
                          setShowActualOrderView(false);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? showActualOrderView
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                          : showActualOrderView
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                      }`}
                      title="Toggle actual master setlist order"
                    >
                      {showActualOrderView ? 'Browse/Sort' : 'Actual Order'}
                    </button>
                  )}

                  {!showActualOrderView && (
                    <button
                      onClick={() => setShowSearch(!showSearch)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? showSearch
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                          : showSearch
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                      }`}
                      title="Search songs"
                    >
                      <Search size={20} />
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-400 hover:bg-gray-500 text-white'
                    }`}
                  >
                    <Download size={18} />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      if (viewMode !== 'preview') {
                        resetSearchAndSort();
                        setShowActualOrderView(false);
                        setViewMode('preview');
                      } else {
                        setShowActualOrderView(false);
                        setViewMode('crud');
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? viewMode === 'crud'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                        : viewMode === 'crud'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }`}
                  >
                    {viewMode === 'preview' ? (
                      <>
                        <Edit2 size={18} />
                        Manage
                      </>
                    ) : (
                      <>
                        <X size={18} />
                        View
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={handleCancel}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                }`}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Search Panel */}
        {showSearch && (
          <div className={`mb-6 rounded-lg p-4 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Search & Sort
              </h2>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {(searchQuery.trim() || sortBy !== 'alphabetical' || sortDirection !== 'asc') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortBy('alphabetical');
                      setSortDirection('asc');
                    }}
                    className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
                      darkMode
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                    }`}
                  >
                    Reset to Default Order
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSortBy('alphabetical');
                    setSortDirection('asc');
                  }}
                className={`p-2 rounded transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by genre, artist, or song title..."
                  className={`w-full px-4 py-2 pr-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                      darkMode
                        ? 'hover:bg-gray-600 text-gray-400 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabetical' | 'genre')}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="alphabetical">Alphabetical (Song Name)</option>
                  <option value="genre">Genre</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Direction
                </label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="asc">Ascending (A-Z)</option>
                  <option value="desc">Descending (Z-A)</option>
                </select>
              </div>
            </div>
            {searchQuery && (() => {
              const sections = parseMarkdown(markdown);
              const filteredSections = getFilteredSections(sections, searchQuery);
              const totalSongs = sections.reduce((sum, s) => sum + s.songs.length, 0);
              const filteredSongs = filteredSections.reduce((sum, s) => sum + s.songs.length, 0);
              
              return (
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {filteredSongs === 0 ? (
                    <span className={darkMode ? 'text-red-400' : 'text-red-600'}>No results found</span>
                  ) : (
                    <span>
                      Showing {filteredSongs} of {totalSongs} songs
                      {filteredSongs < totalSongs && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearch(false);
                          }}
                          className={`ml-2 underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          Clear filter
                        </button>
                      )}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {isEditing ? (
          <div className={`rounded-lg p-6 ${
            darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
          }`}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full h-[600px] p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? 'bg-gray-900 text-white border-gray-700'
                  : 'bg-gray-50 text-gray-900 border-gray-300'
              } border`}
              placeholder="Enter markdown content..."
            />
          </div>
        ) : viewMode === 'crud' ? (
          <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            {/* Add New Song Form */}
            <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h3 className="text-lg font-bold mb-4">Add New Song</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={newSong.section}
                  onChange={(e) => setNewSong({ ...newSong, section: e.target.value })}
                  className={`px-3 py-2 rounded border ${
                    darkMode
                      ? 'bg-gray-600 text-white border-gray-500'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                >
                  <option value="">Select Section</option>
                  {getDisplaySections().map((section, idx) => (
                    <option key={idx} value={section.title}>
                      {section.title}
                    </option>
                  ))}
                  <option value="__NEW__">+ New Section</option>
                </select>
                {newSong.section === '__NEW__' ? (
                  <input
                    type="text"
                    placeholder="New Section Name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className={`px-3 py-2 rounded border ${
                      darkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Song Name"
                      value={newSong.song}
                      onChange={(e) => setNewSong({ ...newSong, song: e.target.value })}
                      className={`px-3 py-2 rounded border ${
                        darkMode
                          ? 'bg-gray-600 text-white border-gray-500'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Artist"
                      value={newSong.artist}
                      onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                      className={`px-3 py-2 rounded border ${
                        darkMode
                          ? 'bg-gray-600 text-white border-gray-500'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    />
                  </>
                )}
                <button
                  onClick={handleAddSong}
                  disabled={!newSong.section || (newSong.section === '__NEW__' ? !newSectionName : (!newSong.song || !newSong.artist))}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  <Plus size={18} className="inline mr-1" />
                  Add
                </button>
              </div>
            </div>

            {/* Songs List */}
            {(() => {
              const displaySections = getDisplaySections();
              const originalSections = getOriginalSections();
              let globalNumber = 1;
              
              // Calculate starting numbers for each section based on original order
              const sectionStartNumbers = new Map<string, number>();
              originalSections.forEach((section) => {
                sectionStartNumbers.set(section.title, globalNumber);
                globalNumber += section.songs.length;
              });
              
              return displaySections.map((section, sectionIdx) => {
                const startNumber = sectionStartNumbers.get(section.title) || 1;
                return (
                  <div key={sectionIdx} className="mb-6">
                    <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.songs.map((songItem, songIdx) => {
                        // Find original index in the original sections
                        const originalSection = originalSections.find(s => s.title === section.title);
                        const originalIndex = originalSection?.songs.findIndex(
                          s => s.song === songItem.song && s.artist === songItem.artist
                        ) ?? songIdx;
                        const songNumber = startNumber + originalIndex;
                        
                        return (
                          <div
                            key={songIdx}
                            draggable
                            onDragStart={(e) => {
                              setDraggedMasterSong({ section: section.title, index: songIdx });
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedMasterSong && 
                                  (draggedMasterSong.section !== section.title || draggedMasterSong.index !== songIdx)) {
                                // Only reorder within the same section for now
                                if (draggedMasterSong.section === section.title) {
                                  handleReorderMasterSong(section.title, draggedMasterSong.index, songIdx);
                                }
                              }
                              setDraggedMasterSong(null);
                            }}
                            className={`flex items-center gap-3 p-3 rounded border-2 transition-all ${
                              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                            } ${draggedMasterSong?.section === section.title && draggedMasterSong?.index === songIdx ? 'opacity-50' : ''} hover:border-gray-400`}
                          >
                            <GripVertical
                              size={20}
                              className={`cursor-move ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                            />
                            <span className={`font-mono text-sm w-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {songNumber}.
                            </span>
                            {editingItem?.section === section.title && editingItem?.index === songIdx ? (
                        <>
                          <input
                            type="text"
                            value={editingItem.song}
                            onChange={(e) => setEditingItem({ ...editingItem, song: e.target.value })}
                            className={`flex-1 px-2 py-1 rounded border ${
                              darkMode
                                ? 'bg-gray-600 text-white border-gray-500'
                                : 'bg-white text-gray-900 border-gray-300'
                            }`}
                          />
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>—</span>
                          <input
                            type="text"
                            value={editingItem.artist}
                            onChange={(e) => setEditingItem({ ...editingItem, artist: e.target.value })}
                            className={`flex-1 px-2 py-1 rounded border ${
                              darkMode
                                ? 'bg-gray-600 text-white border-gray-500'
                                : 'bg-white text-gray-900 border-gray-300'
                            }`}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className={`p-2 rounded transition-colors ${
                              darkMode
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className={`p-2 rounded transition-colors ${
                              darkMode
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                            }`}
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {songItem.song} — {songItem.artist}
                          </span>
                          <button
                            onClick={() => handleEditSong(section.title, songIdx, songItem.song, songItem.artist)}
                            className={`p-2 rounded transition-colors ${
                              darkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(section.title, songIdx, songItem.song, songItem.artist)}
                            className={`p-2 rounded transition-colors ${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : showBuilder ? (
          /* Set List Builder */
          <div className={`rounded-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="mb-6">
              <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={setlistName}
                    onChange={(e) => setSetlistName(e.target.value)}
                    placeholder="Enter setlist name..."
                    disabled={!builderEditMode && currentSetlistId !== null}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode
                        ? builderEditMode || !currentSetlistId
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-gray-600 border-gray-700 text-gray-400 cursor-not-allowed'
                        : builderEditMode || !currentSetlistId
                          ? 'bg-white border-gray-300 text-gray-900'
                          : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {currentSetlistId ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Editing: {setlistName || 'Untitled Setlist'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          New Setlist
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {currentSetlistId && (
                    <button
                      onClick={() => setBuilderEditMode(!builderEditMode)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? builderEditMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                          : builderEditMode
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-400 hover:bg-gray-500 text-white'
                      }`}
                    >
                      {builderEditMode ? (
                        <>
                          <X size={18} className="inline mr-1" />
                          Cancel Edit
                        </>
                      ) : (
                        <>
                          <Edit2 size={18} className="inline mr-1" />
                          Edit
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (currentSetlistId && builderEditMode) {
                        setShowSaveConfirm(true);
                      } else {
                        saveCustomSetlist();
                      }
                    }}
                    disabled={!setlistName.trim() || (!builderEditMode && currentSetlistId !== null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <Save size={18} className="inline mr-1" />
                    {currentSetlistId ? 'Save Changes' : 'Save Setlist'}
                  </button>
                </div>
              </div>

              {/* Custom Setlists List */}
              {customSetlists.length > 0 && (
                <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Saved Setlists:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customSetlists.map((setlist) => (
                      <div
                        key={setlist.id}
                        className={`flex items-center gap-2 px-3 py-1 rounded ${
                          currentSetlistId === setlist.id
                            ? darkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : darkMode
                              ? 'bg-gray-600 text-gray-200'
                              : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        <button
                          onClick={() => loadCustomSetlist(setlist.id!)}
                          className="text-sm hover:underline"
                        >
                          {setlist.name}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${setlist.name}"?`)) {
                              deleteCustomSetlist(setlist.id!);
                            }
                          }}
                          className="hover:opacity-70"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add New Song Form */}
            {builderEditMode && (
              <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add New Song
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={newBuilderSong.section}
                  onChange={(e) => setNewBuilderSong({ ...newBuilderSong, section: e.target.value })}
                  className={`px-3 py-2 rounded border ${
                    darkMode
                      ? 'bg-gray-600 text-white border-gray-500'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                >
                  <option value="">Select Section</option>
                  {(() => {
                    const sections = new Set(builderSongs.map(s => s.section));
                    return Array.from(sections).map((section, idx) => (
                      <option key={idx} value={section}>
                        {section}
                      </option>
                    ));
                  })()}
                  <option value="__NEW__">+ New Section</option>
                </select>
                {newBuilderSong.section === '__NEW__' ? (
                  <input
                    type="text"
                    placeholder="New Section Name"
                    value={newBuilderSectionName}
                    onChange={(e) => setNewBuilderSectionName(e.target.value)}
                    className={`px-3 py-2 rounded border ${
                      darkMode
                        ? 'bg-gray-600 text-white border-gray-500'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Song Name"
                      value={newBuilderSong.song}
                      onChange={(e) => setNewBuilderSong({ ...newBuilderSong, song: e.target.value })}
                      className={`px-3 py-2 rounded border ${
                        darkMode
                          ? 'bg-gray-600 text-white border-gray-500'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Artist"
                      value={newBuilderSong.artist}
                      onChange={(e) => setNewBuilderSong({ ...newBuilderSong, artist: e.target.value })}
                      className={`px-3 py-2 rounded border ${
                        darkMode
                          ? 'bg-gray-600 text-white border-gray-500'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    />
                  </>
                )}
                <button
                  onClick={() => {
                    const sectionTitle = newBuilderSong.section === '__NEW__' ? newBuilderSectionName : newBuilderSong.section;
                    if (!sectionTitle || (newBuilderSong.section !== '__NEW__' && (!newBuilderSong.song || !newBuilderSong.artist))) {
                      return;
                    }
                    
                    const newSong = {
                      section: sectionTitle,
                      song: newBuilderSong.song || '',
                      artist: newBuilderSong.artist || '',
                      id: `${sectionTitle}-${newBuilderSong.song}-${newBuilderSong.artist}-${Date.now()}-${Math.random()}`
                    };
                    
                    setBuilderSongs([...builderSongs, newSong]);
                    setNewBuilderSong({ section: '', song: '', artist: '' });
                    setNewBuilderSectionName('');
                  }}
                  disabled={!newBuilderSong.section || (newBuilderSong.section === '__NEW__' ? !newBuilderSectionName : (!newBuilderSong.song || !newBuilderSong.artist))}
                  className={`px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600'
                      : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
                  }`}
                >
                  <Plus size={18} className="inline mr-1" />
                  Add
                </button>
                </div>
              </div>
            )}

            {/* Builder Songs List - Draggable */}
            <div className={`space-y-2 max-h-[600px] overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 rounded-lg`}>
              {builderSongs.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No songs in setlist. Add songs using the form above or they'll load from the master list when you first open the builder.
                </div>
              ) : (
                builderSongs.map((song, index) => (
                  <div
                    key={song.id}
                    draggable={builderEditMode}
                    onDragStart={(e) => {
                      if (!builderEditMode) {
                        e.preventDefault();
                        return;
                      }
                      setDraggedItem(song);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (!builderEditMode) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      if (!builderEditMode) {
                        e.preventDefault();
                        return;
                      }
                      e.preventDefault();
                      if (draggedItem && draggedItem.id !== song.id) {
                        const newSongs = [...builderSongs];
                        const draggedIndex = newSongs.findIndex(s => s.id === draggedItem.id);
                        const dropIndex = newSongs.findIndex(s => s.id === song.id);
                        newSongs.splice(draggedIndex, 1);
                        newSongs.splice(dropIndex, 0, draggedItem);
                        setBuilderSongs(newSongs);
                      }
                      setDraggedItem(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    } ${draggedItem?.id === song.id ? 'opacity-50' : ''} ${!builderEditMode ? 'cursor-default' : ''}`}
                  >
                    {builderEditMode && (
                      <GripVertical
                        size={20}
                        className={`cursor-move ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      />
                    )}
                    <div className="flex-1">
                      {!builderEditMode ? (
                        <div className="flex items-start justify-between gap-3">
                          <a
                            href={createLyricsSearchUrl(`${song.song} — ${song.artist}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block flex-1"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {index + 1}. {song.song}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {song.artist} • {song.section}
                            </p>
                          </a>
                          <a
                            href={createChordsSearchUrl(`${song.song} — ${song.artist}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-xs opacity-70 hover:opacity-100"
                            aria-label={`Chords search for ${song.song}`}
                            title="Chords"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            ~
                          </a>
                        </div>
                      ) : (
                        <>
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {index + 1}. {song.song}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {song.artist} • {song.section}
                          </p>
                        </>
                      )}
                    </div>
                    {builderEditMode && (
                      <button
                        onClick={() => {
                          setBuilderSongs(builderSongs.filter(s => s.id !== song.id));
                        }}
                        className={`p-2 rounded transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className={`rounded-lg p-6 prose prose-lg max-w-none ${
            darkMode 
              ? 'bg-gray-800 prose-invert prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-code:text-blue-400 prose-pre:bg-gray-900' 
              : 'bg-white shadow-lg prose-headings:text-gray-900 prose-p:text-gray-700'
          }`}>
            {showActualOrderView ? (
              <div className="not-prose">
                <ol className="space-y-2">
                  {getActualOrderItems().map((item, idx) => (
                    <li
                      key={`${item.section}-${item.song}-${item.artist}-${idx}`}
                      className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {idx + 1}.
                      </span>
                      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                        <a
                          href={createLyricsSearchUrl(`${item.song} — ${item.artist}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <span className="font-semibold">{item.song}</span>
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>— {item.artist}</span>
                          <span
                            className={`inline-flex items-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                          >
                            ({item.section})
                          </span>
                        </a>
                        <a
                          href={createChordsSearchUrl(`${item.song} — ${item.artist}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs opacity-70 hover:opacity-100"
                          aria-label={`Chords search for ${item.song}`}
                          title="Chords"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          ~
                        </a>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {getFilteredMarkdown()}
              </ReactMarkdown>
            )}
          </div>
        )}

        {/* Custom Setlists Section */}
        {isAuthenticated && selectedUser && (
          <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'} rounded-lg`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Custom Setlists
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Click a setlist to open it in the builder
              </p>
            </div>
            <div className="p-4">
              {customSetlists.length === 0 ? (
                <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No custom setlists yet. Create one in the Builder!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customSetlists.map((setlist) => (
                    <button
                      key={setlist.id}
                      onClick={() => {
                        setShowBuilder(true);
                        loadCustomSetlist(setlist.id!);
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-650'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {setlist.name}
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {setlist.created_at
                              ? new Date(setlist.created_at).toLocaleDateString()
                              : ''}
                          </p>
                        </div>
                        <ListMusic
                          size={20}
                          className={darkMode ? 'text-gray-400' : 'text-gray-500'}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes/Chat Section */}
        {selectedUser && (
          <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notes
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Chatting as: <span className="font-semibold">{selectedUser}</span>
              </p>
            </div>
            
            {/* Messages Container */}
            <div ref={notesContainerRef} className={`h-64 overflow-y-scroll p-4 space-y-3 notes-scrollbar rounded-lg border-2 m-4 ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-200 border-gray-400'}`}>
              {notesLoading ? (
                <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading messages...
                </div>
              ) : notes.length === 0 ? (
                <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className={`flex flex-col ${
                      note.user_name === selectedUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-1 ${
                      note.user_name === selectedUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      <span className={`text-xs font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {note.user_name}
                      </span>
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {note.created_at ? new Date(note.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ''}
                      </span>
                    </div>
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 overflow-hidden ${
                        note.user_name === selectedUser
                          ? darkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : darkMode
                            ? 'bg-gray-700 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap chat-message">{note.message}</p>
                    </div>
                  </div>
                ))
              )}
              {/* Intentionally no scroll-into-view anchor; we only scroll the notes container when needed */}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Transition appear show={deletingItem !== null} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setDeletingItem(null)}>
          <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black opacity-50" aria-hidden="true" />
              </Transition.Child>

              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl ${
                  darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Confirm Delete
                  </Dialog.Title>
                  {deletingItem && (
                    <div className="mb-4">
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Are you sure you want to delete this song?
                      </p>
                      <p className={`text-base font-semibold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {deletingItem.song} — {deletingItem.artist}
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Section: {deletingItem.section}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      onClick={() => setDeletingItem(null)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Save Confirmation Dialog */}
      <Transition appear show={showSaveConfirm} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setShowSaveConfirm(false)}>
          <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black opacity-50" aria-hidden="true" />
              </Transition.Child>

              <span className="inline-block h-screen align-middle" aria-hidden="true">
                &#8203;
              </span>

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className={`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-2xl ${
                  darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                }`}>
                  <Dialog.Title as="h3" className={`text-lg font-medium leading-6 mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Save Changes?
                  </Dialog.Title>
                  <div className="mb-4">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Are you sure you want to save changes to "{setlistName || 'this setlist'}"?
                    </p>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      This will overwrite the existing setlist with {builderSongs.length} song{builderSongs.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      onClick={() => setShowSaveConfirm(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        saveCustomSetlist();
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        darkMode
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

