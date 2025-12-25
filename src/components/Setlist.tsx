import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useThemeContext } from '../ThemeProvider';
import { Edit2, Save, X, Download, Trash2, Plus, Send } from 'lucide-react';
import { supabase, Song as SupabaseSong, Note } from '../lib/supabase';

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
  const [newSong, setNewSong] = useState({ section: '', song: '', artist: '' });
  const useDB = true; // Always use database
  const [dbLoading, setDbLoading] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<'Collin' | 'Leif' | 'Ryland' | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const notesFetchInProgressRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);

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
      // Fetch all songs ordered by section and order_index
      const { data: songs, error } = await supabase
        .from('songs')
        .select('*')
        .order('section', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Group songs by section
      const sectionsMap = new Map<string, { song: string; artist: string }[]>();
      songs?.forEach((song: SupabaseSong) => {
        if (!sectionsMap.has(song.section)) {
          sectionsMap.set(song.section, []);
        }
        sectionsMap.get(song.section)!.push({ song: song.song, artist: song.artist });
      });

      // Convert to markdown format
      let md = '';
      sectionsMap.forEach((songs, sectionTitle) => {
        md += `## ${sectionTitle}\n`;
        songs.forEach(s => {
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

  const loadNotes = useCallback(async () => {
    // Prevent overlapping calls - if a fetch is already in progress, skip this one
    if (notesFetchInProgressRef.current) {
      return;
    }

    // Check if user is at the bottom before refreshing
    if (notesContainerRef.current) {
      const container = notesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10; // 10px threshold
      shouldAutoScrollRef.current = isAtBottom;
    }

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
  }, []);

  // Load setlist when authenticated and user is selected
  useEffect(() => {
    if (isAuthenticated && selectedUser) {
      loadSetlist();
    }
  }, [isAuthenticated, selectedUser, loadSetlist]);

  // Load notes when authenticated and user is selected
  useEffect(() => {
    if (isAuthenticated && selectedUser) {
      loadNotes();
      // Set up real-time subscription for notes
      const notesSubscription = supabase
        .channel('notes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notes' },
          () => {
            loadNotes();
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
          loadNotes();
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

  // Auto-scroll to bottom when notes change (only if user was at bottom)
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notes]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    // Always auto-scroll when user sends a message
    shouldAutoScrollRef.current = true;

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
      await loadNotes();
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
      const songMatch = line.match(/^-\s+(.+?)\s*[—–-]\s*(.+)$/);
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

  // Custom components for ReactMarkdown to make songs clickable
  const markdownComponents = {
    li: ({ children, ...props }: any) => {
      const fullText = extractText(children);
      
      // Check if this looks like a song entry (contains "—" or "-" separator)
      if (fullText && (fullText.includes('—') || fullText.includes('–') || fullText.match(/^[^-]+\s*-\s*/))) {
        const songName = fullText.split(/[—–-]/)[0].trim();
        if (songName) {
          const searchUrl = createLyricsSearchUrl(fullText);
          return (
            <li {...props} style={{ cursor: 'pointer' }}>
              <a 
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer'
                }}
              >
                {children}
              </a>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Setlist</h1>
          {!isEditing ? (
            <div className="flex gap-2 items-center">
              {dbLoading && (
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</span>
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
                onClick={() => setViewMode(viewMode === 'preview' ? 'crud' : 'preview')}
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
                    Preview
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
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
                  {parseMarkdown(markdown).map((section, idx) => (
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
            {parseMarkdown(markdown).map((section, sectionIdx) => (
              <div key={sectionIdx} className="mb-6">
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.songs.map((songItem, songIdx) => (
                    <div
                      key={songIdx}
                      className={`flex items-center gap-3 p-3 rounded ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
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
                            onClick={() => handleDeleteSong(section.title, songIdx)}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-lg p-6 prose prose-lg max-w-none ${
            darkMode 
              ? 'bg-gray-800 prose-invert prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-code:text-blue-400 prose-pre:bg-gray-900' 
              : 'bg-white shadow-lg prose-headings:text-gray-900 prose-p:text-gray-700'
          }`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {markdown}
            </ReactMarkdown>
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
              <div ref={messagesEndRef} />
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
  );
};

