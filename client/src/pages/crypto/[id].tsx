import { CryptoDetailPage } from '@/components/Crypto/CryptoDetailPage';
import { useParams } from 'wouter';

export default function CryptoDetail() {
  const { id } = useParams();
  
  if (!id) {
    return null;
  }
  
  return <CryptoDetailPage id={id} />;
}
