import { Session } from '@supabase/supabase-js';
import { useTrelloList } from '../services/useTrelloList';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { TrelloCard } from '../types/TrelloCard.types';
import { getTrelloCards, getTrelloCardThumbnailUrl } from '../services/useTrelloCards';
import { useTrelloCardUpdate } from '../services/useTrelloCards';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Button from '@mui/material/Button';
import UpdateList from './UpdateList';

// Lazy load modals to reduce initial bundle size
const CardModal = lazy(() => import('./CardModal'));
const NewCardModal = lazy(() => import('./NewCardModal'));

/**
 * Sales component displays a Trello-style board for managing sales pipeline
 * @param {Session} session - The current user session
 * @returns {JSX.Element} A Trello-style board interface for sales pipeline management
 */
const Sales = ({ session }: { session: Session }) => {
  /**
   * Custom hook to fetch user and company data
   * @param {string} userId - The ID of the current user
   * @returns {Object} Contains company information, error, and loading state
   */
  const { companyInfo, error: companyError, isLoading: companyLoading } = useUserAndCompanyData(session.user.id);

  /**
   * Custom hook to fetch Trello lists
   * @returns {Object} Contains lists data, error, and loading state
   */
  const { data: lists, isLoading: listsLoading, error: listsError, refetch: refetchLists } = useTrelloList();
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  /**
   * Custom hook to fetch Trello cards
   * @param {Array<string>} listIds - Array of list IDs to fetch cards for
   * @returns {Object} Contains all cards data and a refetch function
   */
  const { data: allCards, refetch: refetchCards } = getTrelloCards(lists?.map(list => list.id));
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  /**
   * Custom hook to update Trello cards
   * @returns {Object} Contains a mutation function to update cards
   */
  const cardUpdateMutation = useTrelloCardUpdate();

  /**
   * Fetches and sets thumbnails for a card
   * @param {string} cardId - The ID of the card
   */
  const fetchThumbnails = async (cardId: string) => {
    try {
      const thumbnailUrl = await getTrelloCardThumbnailUrl(cardId);
      if (thumbnailUrl) {
        setThumbnails(prev => ({ ...prev, [cardId]: thumbnailUrl }));
      }
    } catch (error) {
      console.error('Error fetching thumbnails:', error);
    }
  };

  useEffect(() => {
    if (allCards) {
      allCards.flat().forEach(card => {
        if (card && card.id) {
          fetchThumbnails(card.id);
        }
      });
    }
  }, [allCards]);

  /**
   * Memoized function to organize cards by their list
   * @returns {Object} A record of list IDs to arrays of Trello cards
   */
  const cardsByList = useMemo(() => {
    if (!lists || !allCards) return {};
    return lists.reduce((acc, list) => {
      acc[list.id] = (allCards.flat() || [])
        .filter(card => card && card.id && card.list_id === list.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<string, TrelloCard[]>);
  }, [lists, allCards]);

  /**
   * Add this new memoized value to calculate max cards
   */
  const maxCardsInList = useMemo(() => {
    if (!cardsByList) return 0;
    return Math.max(...Object.values(cardsByList).map(cards => cards.length));
  }, [cardsByList]);

  /**
   * Handles updates to a Trello card
   * @param {Partial<TrelloCard>} updatedCard - The updated card data
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

    if (!destination) return;

    const cardToMove = cardsByList[source.droppableId][source.index];
    console.log(`Card: ${cardToMove.title}, Source Position: ${source.index}, Destination Position: ${destination.index}`);

    const sourceList = cardsByList[source.droppableId];
    const destinationList = cardsByList[destination.droppableId];

    if (!sourceList || !destinationList) return;

    const [movedCard] = sourceList.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, movedCard);
    } else {
      destinationList.splice(destination.index, 0, movedCard);
      movedCard.list_id = destination.droppableId;
    }

    const updateCardPositions = (list: TrelloCard[]) => {
      list.forEach((card, index) => {
        card.position = index;
        console.log(`Card: ${card.title}, New Position: ${card.position}`);
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

    refetchCards();
  };

  /**
   * Handles card click event
   * @param {TrelloCard} card - The card that was clicked
   */
  const handleCardClick = (card: TrelloCard) => {
    setSelectedCard(card);
  };

  /**
   * Handles the creation of a new lead
   * @param {Omit<TrelloCard, 'id' | 'created_at'>} newCardData - The data for the new card
   */
  const handleNewLead = async (newCardData: Omit<TrelloCard, 'id' | 'created_at'>) => {
    try {
      console.log('New Lead Data:', newCardData);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {lists && allCards && lists.map((list) => {
            const droppableId = String(list.id);
            const currentListCards = cardsByList[list.id]?.filter(Boolean) || [];
            const emptySpacesNeeded = maxCardsInList - currentListCards.length;

            return (
              <Droppable droppableId={droppableId} key={list.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 rounded-lg p-4 flex flex-col"
                    style={{ height: 'calc(100vh - 200px)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <UpdateList
                        list={list}
                        onUpdateSuccess={() => {
                          refetchLists();
                        }}
                      />
                      <span className="bg-gray-200 px-2 py-1 rounded-full text-sm">
                        {currentListCards.length || 0}
                      </span>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {currentListCards.map((card, index) => {
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
                      {Array.from({ length: emptySpacesNeeded }).map((_, index) => (
                        <div key={`empty-${index}`} className="h-[68px] mb-2" />
                      ))}
                      {provided.placeholder}
                    </div>
                    <Button
                      onClick={() => {
                        setIsModalOpen(true);
                        setSelectedListId(list.id);
                      }}
                      startIcon={<span>+</span>}
                      style={{ color: '#6b7280' }}
                      className="mt-2"
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

      <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>
    </div>
  );
};

export default Sales;
