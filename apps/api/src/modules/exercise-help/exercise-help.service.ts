import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

type ExerciseDbItem = {
  id?: string;
  exerciseId?: string;
  name?: string;
  exerciseName?: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  gifUrl?: string;
  imageUrl?: string;
  instructions?: string[];
  secondaryMuscles?: string[];
  primaryMuscles?: string[];
};

@Injectable()
export class ExerciseHelpService {
  private readonly apiHost = process.env.EXERCISEDB_RAPIDAPI_HOST || 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
  private readonly apiKey = process.env.EXERCISEDB_RAPIDAPI_KEY || '';
  private readonly baseUrl = process.env.EXERCISEDB_BASE_URL || 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
  private readonly requestTimeoutMs = Number(process.env.EXERCISEDB_TIMEOUT_MS ?? 9000);
  private readonly cacheTtlMs = Number(process.env.EXERCISEDB_CACHE_TTL_MS ?? 10 * 60 * 1000);
  private readonly cache = new Map<string, { expiresAt: number; value: ReturnType<ExerciseHelpService['toApiResponse']> }>();
  private readonly aliasByNormalizedName: Record<string, string[]> = {
    'supino reto': ['bench press', 'barbell bench press'],
    supino: ['bench press'],
    'supino inclinado': ['incline bench press'],
    'supino declinado': ['decline bench press'],
    agachamento: ['barbell squat', 'squat'],
    'leg press': ['sled leg press', 'leg press'],
    levantamento: ['deadlift'],
    'levantamento terra': ['deadlift', 'barbell deadlift'],
    remada: ['barbell row', 'seated cable row'],
    'puxada frontal': ['lat pulldown'],
    desenvolvimento: ['shoulder press', 'military press'],
    rosca: ['biceps curl', 'barbell curl'],
    'triceps testa': ['lying triceps extension'],
    prancha: ['plank'],
    abdominal: ['sit-up', 'crunch'],
    flexao: ['push-up'],
  };
  private readonly translateBodyPart: Record<string, string> = {
    chest: 'Peito',
    back: 'Costas',
    legs: 'Pernas',
    shoulders: 'Ombros',
    arms: 'Bracos',
    waist: 'Abdomen',
    cardio: 'Cardio',
    glutes: 'Gluteos',
  };
  private readonly translateTarget: Record<string, string> = {
    quadriceps: 'Quadriceps',
    glutes: 'Gluteos',
    hamstrings: 'Posteriores de coxa',
    calves: 'Gemeos',
    biceps: 'Biceps',
    triceps: 'Triceps',
    delts: 'Deltoides',
    pectorals: 'Peitorais',
    lats: 'Latissimo do dorso',
    abs: 'Abdominais',
    obliques: 'Obliquos',
    forearms: 'Antebracos',
    traps: 'Trapezio',
    adductors: 'Adutores',
    abductors: 'Abdutores',
  };
  private readonly translateEquipment: Record<string, string> = {
    barbell: 'Barra',
    dumbbell: 'Halteres',
    'body weight': 'Peso corporal',
    machine: 'Maquina',
    cable: 'Cabo',
    kettlebell: 'Kettlebell',
    'medicine ball': 'Bola medicinal',
    'resistance band': 'Elastico',
    'smith machine': 'Maquina smith',
    'ez bar': 'Barra EZ',
    assisted: 'Assistido',
    rope: 'Corda',
    bench: 'Banco',
  };

  async findByName(name: string) {
    if (!this.apiKey) {
      throw new InternalServerErrorException('EXERCISEDB_RAPIDAPI_KEY nao configurada no servidor.');
    }

    const normalizedName = this.normalize(name);
    const cached = this.cache.get(normalizedName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const candidates = this.buildCandidates(name);
    const allItems: ExerciseDbItem[] = [];
    let lastFailureStatus: number | null = null;

    const searchParams = ['search'];

    for (const candidate of candidates) {
      for (const param of searchParams) {
        const result = await this.fetchBySearch(candidate, param);
        if (result.status === 200) {
          allItems.push(...result.items);
          if (allItems.length) break;
          continue;
        }

        if (result.status === 404) {
          continue;
        }

        lastFailureStatus = result.status;
        break;
      }
      if (allItems.length || lastFailureStatus !== null) break;
    }

    if (lastFailureStatus !== null) {
      if (lastFailureStatus === 401 || lastFailureStatus === 403) {
        throw new ServiceUnavailableException('Falha de autenticacao na ExerciseDB (verifique API key/plano).');
      }
      if (lastFailureStatus === 429) {
        throw new ServiceUnavailableException('Limite de requisicoes da ExerciseDB atingido. Tente novamente em instantes.');
      }
      throw new ServiceUnavailableException(`Falha ao consultar a base de exercicios (status upstream: ${lastFailureStatus}).`);
    }

    const items = this.uniqueByIdOrName(allItems);
    let mergedItems = items;

    if (!mergedItems.length) {
      const searchAll = await this.fetchSearchAll();
      if (searchAll.status === 200 && searchAll.items.length) {
        const filtered = this.filterByName(name, searchAll.items);
        mergedItems = this.uniqueByIdOrName(filtered);
      }
    }

    if (!mergedItems.length) {
      const fallback = await this.fetchAll();
      if (fallback.status === 200) {
        const filtered = this.filterByName(name, fallback.items);
        mergedItems = this.uniqueByIdOrName(filtered);
      }
    }

    let bestMatch = this.pickBestMatch(name, mergedItems);

    if (bestMatch) {
      const details = await this.fetchDetailsIfNeeded(bestMatch);
      if (details) {
        bestMatch = { ...bestMatch, ...details };
      }
    }

    const result = this.toApiResponse(bestMatch, mergedItems);

    this.cache.set(normalizedName, {
      expiresAt: Date.now() + this.cacheTtlMs,
      value: result,
    });

    return result;
  }

  private async fetchBySearch(name: string, param: string): Promise<{ status: number; items: ExerciseDbItem[] }> {
    const endpoint = `${this.baseUrl}/api/v1/exercises/search`;
    const url = new URL(endpoint);
    url.searchParams.set(param, name);
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response: any;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        throw new ServiceUnavailableException('Consulta de exercicios expirou. Tente novamente.');
      }
      throw new ServiceUnavailableException('Falha ao consultar a base de exercicios.');
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      return { status: response.status, items: [] };
    }

    const payload = (await response.json()) as any;
    const items =
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.data?.exercises) && payload.data.exercises) ||
      (Array.isArray(payload?.exercises) && payload.exercises) ||
      (Array.isArray(payload) && payload) ||
      [];
    return { status: response.status, items };
  }

  private async fetchAll(): Promise<{ status: number; items: ExerciseDbItem[] }> {
    const endpoint = `${this.baseUrl}/api/v1/exercises`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response: any;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        throw new ServiceUnavailableException('Consulta de exercicios expirou. Tente novamente.');
      }
      throw new ServiceUnavailableException('Falha ao consultar a base de exercicios.');
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      return { status: response.status, items: [] };
    }

    const payload = (await response.json()) as any;
    const items =
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.data?.exercises) && payload.data.exercises) ||
      (Array.isArray(payload?.exercises) && payload.exercises) ||
      (Array.isArray(payload) && payload) ||
      [];

    return { status: response.status, items };
  }

  private async fetchDetailsIfNeeded(item: ExerciseDbItem): Promise<ExerciseDbItem | null> {
    if (item.bodyPart || item.target || item.equipment || (item.instructions && item.instructions.length)) {
      return null;
    }

    const id = item.exerciseId ?? item.id;
    if (!id) return null;

    const candidates = [
      `${this.baseUrl}/api/v1/exercises/${id}`,
      `${this.baseUrl}/api/v1/exercises/id/${id}`,
      `${this.baseUrl}/api/v1/exercise/${id}`,
    ];

    for (const endpoint of candidates) {
      const result = await this.fetchDetails(endpoint);
      if (result) return result;
    }

    return null;
  }

  private async fetchDetails(endpoint: string): Promise<ExerciseDbItem | null> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response: any;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        throw new ServiceUnavailableException('Consulta de exercicios expirou. Tente novamente.');
      }
      throw new ServiceUnavailableException('Falha ao consultar a base de exercicios.');
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) return null;

    const payload = (await response.json()) as any;
    const item =
      (payload?.data?.exercise && payload.data.exercise) ||
      (payload?.data && payload.data) ||
      payload ||
      null;

    if (!item || Array.isArray(item)) return null;
    return item as ExerciseDbItem;
  }

  private async fetchSearchAll(): Promise<{ status: number; items: ExerciseDbItem[] }> {
    const endpoint = `${this.baseUrl}/api/v1/exercises/search`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    let response: any;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
        },
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        throw new ServiceUnavailableException('Consulta de exercicios expirou. Tente novamente.');
      }
      throw new ServiceUnavailableException('Falha ao consultar a base de exercicios.');
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      return { status: response.status, items: [] };
    }

    const payload = (await response.json()) as any;
    const items =
      (Array.isArray(payload?.data) && payload.data) ||
      (Array.isArray(payload?.data?.exercises) && payload.data.exercises) ||
      (Array.isArray(payload?.exercises) && payload.exercises) ||
      (Array.isArray(payload) && payload) ||
      [];

    return { status: response.status, items };
  }

  private filterByName(name: string, items: ExerciseDbItem[]): ExerciseDbItem[] {
    const normalized = this.normalize(name);
    if (!normalized) return items;
    return items.filter((item) => {
      const itemName = this.normalize(item.name ?? item.exerciseName);
      return itemName.includes(normalized);
    });
  }

  private buildCandidates(name: string): string[] {
    const normalized = this.normalize(name);
    const aliases = this.aliasByNormalizedName[normalized] ?? [];
    const cleaned = name.trim();
    const normalizedValue = this.normalize(cleaned);
    // Try aliases first (API expects English terms like "bench press").
    return [...new Set([...aliases, cleaned, normalizedValue].filter(Boolean))];
  }

  private uniqueByIdOrName(items: ExerciseDbItem[]): ExerciseDbItem[] {
    const seen = new Set<string>();
    const result: ExerciseDbItem[] = [];
    for (const item of items) {
      const key = `${item.id ?? ''}|${this.normalize(item.name)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  private pickBestMatch(name: string, items: ExerciseDbItem[]) {
    if (!items.length) return null;
    const normalized = this.normalize(name);
    const aliases = this.aliasByNormalizedName[normalized] ?? [];

    const scored = items
      .map((item) => ({ item, score: this.scoreItem(normalized, aliases, item) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    if (!scored.length) return null;
    return scored[0].item;
  }

  private toResponse(item: ExerciseDbItem) {
    return {
      id: item.exerciseId ?? item.id ?? null,
      name: item.name ?? item.exerciseName ?? 'Exercicio',
      bodyPart: this.translateValue(item.bodyPart, this.translateBodyPart) ?? 'Nao informado',
      target: this.translateValue(item.target, this.translateTarget) ?? 'Nao informado',
      equipment: this.translateValue(item.equipment, this.translateEquipment) ?? 'Nao informado',
      instructions: this.translateInstructions(item.instructions ?? []),
      secondaryMuscles: this.translateList(item.secondaryMuscles ?? item.primaryMuscles ?? [], this.translateTarget),
      gifUrl: item.gifUrl ?? item.imageUrl ?? null,
    };
  }

  private toApiResponse(bestMatch: ExerciseDbItem | null, items: ExerciseDbItem[]) {
    return {
      found: !!bestMatch,
      data: bestMatch ? this.toResponse(bestMatch) : null,
      suggestions: [...new Set(items.slice(0, 5).map((item) => item.name).filter(Boolean))],
    };
  }

  private normalize(value?: string) {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private scoreItem(normalizedQuery: string, aliases: string[], item: ExerciseDbItem): number {
    const name = this.normalize(item.name ?? item.exerciseName);
    if (!name) return 0;
    if (name === normalizedQuery) return 100;

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const aliasHit = aliases.some((alias) => this.normalize(alias) === name || name.includes(this.normalize(alias)));
    if (aliasHit) return 85;

    const allTokens = tokens.length > 0 && tokens.every((t) => name.includes(t));
    if (allTokens) return 80;

    const anyToken = tokens.some((t) => name.includes(t));
    if (anyToken) return 60;

    return 0;
  }

  private translateValue(value: string | undefined, dict: Record<string, string>): string | null {
    if (!value) return null;
    const key = this.normalize(value);
    return dict[key] ?? this.titleCase(value);
  }

  private translateList(values: string[], dict: Record<string, string>): string[] {
    return values.map((value) => this.translateValue(value, dict) ?? value);
  }

  private translateInstructions(steps: string[]): string[] {
    if (!steps.length) return [];
    const map: Record<string, string> = {
      grip: 'pegada',
      bench: 'banco',
      barbell: 'barra',
      dumbbell: 'halter',
      shoulders: 'ombros',
      shoulder: 'ombro',
      chest: 'peito',
      back: 'costas',
      hips: 'quadris',
      knees: 'joelhos',
      lift: 'levante',
      lower: 'abaixe',
      slowly: 'lentamente',
      repeat: 'repita',
      inhale: 'inspire',
      exhale: 'expire',
    };

    return steps.map((step) => {
      let out = step;
      for (const [from, to] of Object.entries(map)) {
        const re = new RegExp(`\\b${from}\\b`, 'gi');
        out = out.replace(re, to);
      }
      return out;
    });
  }

  private titleCase(value: string): string {
    return value
      .split(/\s+/)
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
      .join(' ');
  }
}
