import { Session } from '@supabase/supabase-js';
import { useTrelloList } from '../services/useTrelloList';
import { useUserAndCompanyData } from '../../../shared/hooks/useUserAndCompanyData';
import { useState, useMemo } from 'react';
import CardModal from './CardModal';
import { TrelloCard } from '../types/TrelloCard.types';
import { useTrelloCards } from '../services/useTrelloCards';

/**
 * Sales component displays a Trello-style board for managing sales pipeline
 * @param {Session} session - The current user session
 */
const Sales = ({ session }: { session: Session }) => {
  const { companyInfo, error: companyError, isLoading: companyLoading } = useUserAndCompanyData(session.user.id);
  const { data: lists, isLoading: listsLoading, error: listsError } = useTrelloList();
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);

  const { data: allCards } = useTrelloCards(lists?.map(list => list.id));

  // Group cards by list
  const cardsByList = useMemo(() => {
    if (!lists || !allCards) return {};
    return lists.reduce((acc, list, index) => {
      acc[list.id] = allCards[index] || [];
      return acc;
    }, {} as Record<string, TrelloCard[]>);
  }, [lists, allCards]);

  // Add this function to handle card updates
  const handleCardUpdate = (updatedCard: Partial<TrelloCard>) => {
    // TODO: Implement the API call to update the card
    console.log('Updated card:', updatedCard);
  };

  if (listsLoading || companyLoading) return <div>Loading...</div>;
  if (listsError || companyError) return <div>Error loading data</div>;

  return (
    <div className="p-6">
      {companyInfo && (
        <div className="mb-4">
          <h2 className="text-lg text-gray-600">Company: {companyInfo.name}</h2>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Sales Pipeline</h1>
      <div className="flex gap-4 overflow-x-auto">
        {lists?.map((list) => (
          <div
            key={list.id}
            className="bg-gray-100 rounded-lg p-4 min-w-[300px]"
          >
            <h2 className="font-semibold mb-4">{list.name}</h2>
            <div className="min-h-[200px]">
              {cardsByList[list.id]?.map((card) => (
                <div 
                  key={card.id}
                  className="bg-white rounded p-3 mb-2 shadow-sm cursor-pointer hover:bg-gray-50"
                  style={{ backgroundColor: card.color_code || 'white' }}
                  onClick={() => setSelectedCard(card)}
                >
                  {card.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={handleCardUpdate}
        />
      )}
    </div>
  );
};

export default Sales;
