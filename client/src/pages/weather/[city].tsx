import { WeatherDetailPage } from '@/components/Weather/WeatherDetailPage';
import { useParams } from 'wouter';

export default function WeatherDetail() {
  const { city } = useParams();
  
  if (!city) {
    return null;
  }
  
  return <WeatherDetailPage city={city} />;
}
