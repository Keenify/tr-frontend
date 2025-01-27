import React from "react";
import { TrelloBoard } from "../../../shared/components/trello/TrelloBoard";
import { Session } from "@supabase/supabase-js";

interface ResourcesProps {
  session: Session;
}

/**
 * Resources Component
 * 
 * A Trello-like board implementation for managing company resources and documents.
 * Handles the integration between the Trello UI components and backend API calls.
 * 
 * Features:
 * - Drag and drop lists and cards
 * - Add/edit lists and cards
 * - Resource categorization
 * - Document management
 * 
 * @component
 * @param {Session} session - User session information for API authentication
 */
const Resources: React.FC<ResourcesProps> = ({ session }) => {
  const initialLists = [
    {
      id: "1",
      title: "Documents",
      cards: [
        {
          id: "card-1",
          title: "Company Profile",
          description: "Overview of company structure and services",
          thumbnailUrl: "https://example.com/thumbnail1.jpg",
        },
        {
          id: "card-2",
          title: "Employee Handbook",
          description: "Guidelines and policies for employees",
        },
      ],
    },
    {
      id: "2",
      title: "Training Materials",
      cards: [
        {
          id: "card-3",
          title: "Sales Training",
          description: "Sales techniques and best practices",
          colorCode: "#f0f9ff",
        },
        {
          id: "card-4",
          title: "Product Knowledge",
          description: "Detailed product information and specs",
        },
      ],
    },
  ];

  /**
   * API Integration Points:
   * 
   * Implement the following handlers to connect with your backend:
   */

  /**
   * Updates list position in the backend
   * @param sourceIndex - Original position of the list
   * @param destinationIndex - New position of the list
   */
  const handleListMove = async (sourceIndex: number, destinationIndex: number) => {
    // TODO: Implement API call
    // Example:
    // await supabase
    //   .from('lists')
    //   .update({ position: destinationIndex })
    //   .eq('id', listId);
  };

  /**
   * Updates card position, potentially between different lists
   * @param sourceListId - ID of the original list
   * @param destinationListId - ID of the target list
   * @param sourceIndex - Original position in the list
   * @param destinationIndex - New position in the list
   * @param cardId - ID of the card being moved
   */
  const handleCardMove = async (
    sourceListId: string,
    destinationListId: string,
    sourceIndex: number,
    destinationIndex: number,
    cardId: string
  ) => {
    // TODO: Implement API call
    // Example:
    // await supabase
    //   .from('cards')
    //   .update({ 
    //     list_id: destinationListId,
    //     position: destinationIndex 
    //   })
    //   .eq('id', cardId);
  };

  /**
   * Updates card details in the backend
   * @param listId - ID of the list containing the card
   * @param cardId - ID of the card to update
   * @param updates - Object containing the updated card properties
   */
  const handleCardUpdate = async (listId: string, cardId: string, updates: any) => {
    // TODO: Implement API call
    // Example:
    // await supabase
    //   .from('cards')
    //   .update(updates)
    //   .eq('id', cardId);
  };

  /**
   * Updates list title in the backend
   * @param listId - ID of the list to update
   * @param newTitle - New title for the list
   */
  const handleListTitleChange = async (listId: string, newTitle: string) => {
    // TODO: Implement API call
    // Example:
    // await supabase
    //   .from('lists')
    //   .update({ title: newTitle })
    //   .eq('id', listId);
  };

  /**
   * Creates a new card in the specified list
   * @param listId - ID of the list to add the card to
   */
  const handleCardAdd = async (listId: string) => {
    // TODO: Implement API call
    // Example:
    // await supabase
    //   .from('cards')
    //   .insert({
    //     list_id: listId,
    //     title: 'New Card',
    //     position: lastPosition + 1
    //   });
  };

  /**
   * Creates a new list
   * @param title - Title of the new list
   */
  const handleListAdd = async (title: string) => {
    // TODO: Implement API call
    // Example:
    // await supabase
    //   .from('lists')
    //   .insert({
    //     title,
    //     position: lastPosition + 1
    //   });
  };

  console.log(session);
  return (
    <div className="min-h-screen p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Resources</h1>
      <TrelloBoard 
        initialLists={initialLists}
        onListMove={handleListMove}
        onCardMove={handleCardMove}
        onCardUpdate={handleCardUpdate}
        onListTitleChange={handleListTitleChange}
        onCardAdd={handleCardAdd}
        onListAdd={handleListAdd}
      />
    </div>
  );
};

export default Resources;
