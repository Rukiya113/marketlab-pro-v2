import {settingsStore} from '@/lib/settings/singleton';
import type {PaperBrokerConfig} from './config';
export function currentPaperBrokerConfig():PaperBrokerConfig{const p=settingsStore.get().settings.paper;return{startingCapital:p.startingCapital,slippageBps:p.slippageBps,chargeBps:p.chargeBps,maxOrderQuantity:p.maxOrderQuantity,maxQuoteAgeMs:15_000}}
