import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { disciplineContentApi } from "@/api/pedagogico";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon } from "@/components/ui/icons";

interface CompletenessCheckerProps {
  disciplineId: string;
}

export function CompletenessChecker({ disciplineId }: CompletenessCheckerProps) {
  const [completeness, setCompleteness] = useState<{
    items: { id: string; name: string; isCompleted: boolean }[];
    progress: number;
  }>({ items: [], progress: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        setLoading(true);
        const data = await disciplineContentApi.getCompleteness(disciplineId);
        setCompleteness(data);
        setError(null);
      } catch (err) {
        console.error("Erro ao verificar completude da disciplina:", err);
        setError("Não foi possível verificar a completude da disciplina.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteness();
  }, [disciplineId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm mb-2">Verificando recursos da disciplina...</p>
          <Progress value={0} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const isComplete = completeness.progress === 100;

  return (
    <Card className={isComplete ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium">
            {isComplete 
              ? "Disciplina completa e pronta para uso!"
              : "Complete todos os elementos pedagógicos obrigatórios:"}
          </p>
          <span className="text-sm font-bold">
            {completeness.progress}% completo
          </span>
        </div>

        <Progress value={completeness.progress} className="h-2 mb-4" />

        <ul className="space-y-1">
          {completeness.items.map((item) => (
            <li key={item.id} className="flex items-center text-sm">
              {item.isCompleted ? (
                <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-amber-600 mr-2" />
              )}
              <span className={item.isCompleted ? "text-green-800" : "text-amber-800"}>
                {item.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}