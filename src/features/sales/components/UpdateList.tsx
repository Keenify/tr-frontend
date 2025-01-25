import React, { useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { editTrelloList } from '../services/useTrelloList';
import { TrelloList } from '../types/TrelloList.types';

interface UpdateListProps {
  list: TrelloList;
  onUpdateSuccess: (updatedList: Partial<TrelloList>) => void;
}

const UpdateList: React.FC<UpdateListProps> = ({ list, onUpdateSuccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [listName, setListName] = useState(list.name);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListName(event.target.value);
  };

  const handleBlur = async () => {
    if (listName !== list.name) {
      try {
        const updatedList = { ...list, name: listName };
        await editTrelloList(list.id, updatedList);
        onUpdateSuccess(updatedList);
      } catch (error) {
        console.error('Error updating list name:', error);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center">
      {isEditing ? (
        <TextField
          value={listName}
          onChange={handleNameChange}
          onBlur={handleBlur}
          autoFocus
          size="small"
        />
      ) : (
        <h2 className="font-semibold capitalize">{list.name.toLowerCase()}</h2>
      )}
      <IconButton onClick={handleEditClick} size="small">
        <EditIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

export default UpdateList; 