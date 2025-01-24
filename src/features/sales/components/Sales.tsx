import { Session } from '@supabase/supabase-js';
import { useTrelloList } from '../services/useTrelloList';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useState, useMemo, useEffect } from 'react';
import CardModal from './CardModal';
import { TrelloCard } from '../types/TrelloCard.types';
import { getTrelloCards, getTrelloCardThumbnailUrl } from '../services/useTrelloCards';
import { useTrelloCardUpdate } from '../services/useTrelloCards';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import NewCardModal from './NewCardModal';
import Button from '@mui/material/Button';

/**
 * Sales component displays a Trello-style board for managing sales pipeline
 * @param {Session} session - The current user session
 * @returns {JSX.Element} A Trello-style board interface for sales pipeline management
 */
const Sales = ({ session }: { session: Session }) => {
  const { companyInfo, error: companyError, isLoading: companyLoading } = useUserAndCompanyData(session.user.id);
  const { data: lists, isLoading: listsLoading, error: listsError } = useTrelloList();
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const { data: allCards, refetch: refetchCards } = getTrelloCards(lists?.map(list => list.id));

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Function to fetch and set thumbnails for a card
  const fetchThumbnails = async (cardId: string) => {
    try {
      const thumbnailUrl = await getTrelloCardThumbnailUrl(cardId);
      if (thumbnailUrl) {
        setThumbnails(prev => ({ ...prev, [cardId]: thumbnailUrl }));
      }
    } catch (error) {
    //   console.error('Error fetching thumbnails:', error);
    }
  };

  // Fetch thumbnails after cards are loaded
  useEffect(() => {
    if (allCards) {
      allCards.flat().forEach(card => {
        if (card && card.id) {
          fetchThumbnails(card.id);
        }
      });
    }
  }, [allCards]);

  // Ensure cardsByList is only computed when lists and allCards are available
  const cardsByList = useMemo(() => {
    if (!lists || !allCards) return {};
    return lists.reduce((acc, list) => {
      acc[list.id] = (allCards.flat() || [])
        .filter(card => card && card.id && card.list_id === list.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<string, TrelloCard[]>);
  }, [lists, allCards]);

  // Update the handleCardUpdate function to use the mutation
  const cardUpdateMutation = useTrelloCardUpdate();

  /**
   * Handles updates to a Trello card
   * @param {Partial<TrelloCard>} updatedCard - The updated card data
   * @returns {void}
   */
  const handleCardUpdate = (updatedCard: Partial<TrelloCard>) => {
    if (!selectedCard) return;
    cardUpdateMutation.mutate({
      cardId: selectedCard.id,
      updateData: updatedCard
    });
  };

  /**
   * Handles the end of a drag operation
   * @param {DropResult} result - The result of the drag operation
   */
  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // Return if dropped outside a droppable area
    if (!destination) {
      return;
    }

    // Log the source and destination positions along with the card name
    const cardToMove = cardsByList[source.droppableId][source.index];
    console.log(`Card: ${cardToMove.title}, Source Position: ${source.index}, Destination Position: ${destination.index}`);

    // Optimistically update the UI
    const sourceList = cardsByList[source.droppableId];
    const destinationList = cardsByList[destination.droppableId];

    if (!sourceList || !destinationList) return;

    const [movedCard] = sourceList.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      // Move within the same list
      sourceList.splice(destination.index, 0, movedCard);
    } else {
      // Move to a different list
      destinationList.splice(destination.index, 0, movedCard);
      movedCard.list_id = destination.droppableId; // Update the list ID
    }

    // Update the positions of the affected cards
    const updateCardPositions = (list: TrelloCard[]) => {
      list.forEach((card, index) => {
        card.position = index;
        console.log(`Card: ${card.title}, New Position: ${card.position}`);
        // Trigger the mutation to update the server for each card
        cardUpdateMutation.mutate({
          cardId: card.id,
          updateData: {
            position: index,
            list_id: card.list_id,
          },
        }, {
          onSuccess: () => {
            console.log('Card update successful');
          },
          onError: (error) => {
            console.error('Error updating card:', error);
          }
        });
      });
    };

    updateCardPositions(sourceList);
    if (source.droppableId !== destination.droppableId) {
      updateCardPositions(destinationList);
    }

    refetchCards(); // Ensure the cards are refetched after updates
  };

  // Function to handle card click
  const handleCardClick = (card: TrelloCard) => {
    setSelectedCard(card);
  };

  const handleNewLead = async (newCardData: Omit<TrelloCard, 'id' | 'created_at'>) => {
    try {
      // Logic to handle new lead without creating the Trello card directly
      console.log('New Lead Data:', newCardData);
      
      // Refresh the cards after handling a new lead
      refetchCards();
    } catch (error) {
      console.error('Error handling new lead:', error);
    } finally {
      setIsModalOpen(false);
    }
  };

  if (listsLoading || companyLoading) return <div>Loading...</div>;
  if (listsError || companyError) return <div>Error loading data</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        {companyInfo && (
          <h2 className="text-lg text-gray-600">Company: {companyInfo.name}</h2>
        )}
      </div>
      <h1 className="text-2xl font-bold mb-6">Sales Pipeline</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lists && allCards && lists.map((list) => {
            const droppableId = String(list.id);
            return (
              <Droppable droppableId={droppableId} key={list.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 rounded-lg p-4"
                    style={{ height: 'auto' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold capitalize">{list.name.toLowerCase()}</h2>
                      <span className="bg-gray-200 px-2 py-1 rounded-full text-sm">
                        {cardsByList[list.id]?.length || 0}
                      </span>
                    </div>
                    <div>
                      {cardsByList[list.id]?.filter(Boolean).map((card, index) => {
                        const draggableId = card.id;
                        return (
                          <Draggable 
                            key={draggableId} 
                            draggableId={draggableId} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded p-3 mb-2 shadow-sm cursor-pointer hover:bg-gray-50 draggable-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                style={{
                                  backgroundColor: card.color_code || 'white',
                                  ...provided.draggableProps.style
                                }}
                                onClick={() => handleCardClick(card)}
                              >
                                {thumbnails[card.id] && (
                                  <img src={thumbnails[card.id]} alt="Thumbnail" className="w-full h-32 object-cover mb-2 rounded" />
                                )}
                                {card.title}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                    <Button
                      onClick={() => {
                        setIsModalOpen(true);
                        setSelectedListId(list.id);
                      }}
                      startIcon={<span>+</span>}
                      style={{ color: '#6b7280' }}
                    >
                      Add a Card
                    </Button>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={handleCardUpdate}
          onDeleteSuccess={refetchCards}
        />
      )}

      <NewCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleNewLead}
        lists={lists || []}
        selectedListId={selectedListId}
      />
    </div>
  );
};

export default Sales;
