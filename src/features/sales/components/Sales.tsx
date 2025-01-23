import { Session } from '@supabase/supabase-js';
import { useTrelloList } from '../services/useTrelloList';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useState, useMemo } from 'react';
import CardModal from './CardModal';
import { TrelloCard } from '../types/TrelloCard.types';
import { getTrelloCards } from '../services/useTrelloCards';
import { useTrelloCardUpdate } from '../services/useTrelloCards';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import NewCardModal from './NewCardModal';

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

  const { data: allCards } = getTrelloCards(lists?.map(list => list.id));

  // Ensure cardsByList is only computed when lists and allCards are available
  const cardsByList = useMemo(() => {
    if (!lists || !allCards) return {};
    return lists.reduce((acc, list) => {
      acc[list.id] = (allCards.flat() || []).filter(card => 
        card && card.id && card.list_id === list.id
      );
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
    const { destination, source, draggableId } = result;

    // Return if dropped outside a droppable area or in the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the card that was dragged
    const card = cardsByList[source.droppableId]?.find(
      card => card.id === draggableId
    );

    if (!card) return;

    // Update the card with the new list ID
    cardUpdateMutation.mutate({
      cardId: draggableId,
      updateData: {
        list_id: destination.droppableId
      }
    });
  };

  // Function to handle card click
  const handleCardClick = (card: TrelloCard) => {
    setSelectedCard(card);
  };

  const handleNewLead = (newCardData: Omit<TrelloCard, 'id' | 'created_at'>) => {
    // Logic to save the new card, e.g., calling an API or updating state
    // For now, just log the new card data
    console.log('New Lead Created:', newCardData);
    setIsModalOpen(false);
  };

  if (listsLoading || companyLoading) return <div>Loading...</div>;
  if (listsError || companyError) return <div>Error loading data</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        {companyInfo && (
          <h2 className="text-lg text-gray-600">Company: {companyInfo.name}</h2>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          New Lead
        </button>
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
                    className="bg-gray-100 rounded-lg p-4 min-h-[200px]"
                  >
                    <h2 className="font-semibold mb-4 capitalize">{list.name.toLowerCase()}</h2>
                    <div className="min-h-[200px]">
                      {cardsByList[list.id]?.filter(Boolean).map((card, index) => {
                        const draggableId = card.id;
                        return (
                          <Draggable 
                            key={draggableId} 
                            draggableId={draggableId} 
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white rounded p-3 mb-2 shadow-sm cursor-pointer hover:bg-gray-50"
                                style={{
                                  backgroundColor: card.color_code || 'white',
                                  ...provided.draggableProps.style
                                }}
                                onClick={() => handleCardClick(card)}
                              >
                                {card.title}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
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
        />
      )}

      <NewCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleNewLead}
        lists={lists || []}
      />
    </div>
  );
};

export default Sales;
