import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface EditorProps {
  initialContent: string;
  title: string;
  session: any;
}

const Editor: React.FC<EditorProps> = ({ initialContent, title }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
  });

  return (
    <div className="editor">
      <h1>{title}</h1>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
