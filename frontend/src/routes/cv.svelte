<script>
  import { browser } from '$app/env'

  import Head from "$lib/components/seo/head.svelte"
  import CV from "$lib/components/chunks/cv.svelte"
  import Composition from "$lib/components/ui/composition.svelte"  
  import Content from "$lib/components/chunks/content.svelte"
  import Sidebar from "$lib/components/chunks/sidebar.svelte"
  import Loader from "$lib/components/ui/loader.svelte"

  import { status, loading, pathChanger } from "$lib/components/utils/"
  status.set("cv")

  let age = new Date().getFullYear() - 1987
  let experience = new Date().getFullYear() - 2010

  browser && loading.set(false)
</script>

<Head title="Резюме" />
<Content {status} {loading}>
  <Sidebar />
  <CV {status} {loading}>
    <Loader {loading} />
    <div class="row full">
      <span class="cv-photo">
        <img src="/images/photo.jpg" width="160px" alt="Шарапов Александр Вячеславович" />
      </span>
      <h1 class="narrow">Шарапов Александр Вячеславович</h1>
      <p class="narrow"><strong class="hight">{age} лет</strong>, <strong>Гомель</strong>, <strong>Беларусь</strong></p>
      <p><strong>Образование:</strong> <strong>Высшее</strong>, Беларусская государственная академия связи, 2010<br />
        Факультет телекоммуникаций (сети телекоммуникаций)<br />
        Инженер по телекоммуникациям
      </p>
      <h5>Дополнительное:</h5>
      <p><strong>Cisco Network Academy:</strong> CCNA Exploration, CCNA Networks</p>
      <p>&nbsp;</p>
      <h3 class="narrow">Кратко обо мне:</h3>
      <p>Веб-разработчик полного цикла, большинство своих проектов вёл от идеи до продукта. Понимаю проблемы пользователей и реализую решения исходя из реальных потребностей. Практикую подход <strong>Design Driven Development</strong>. Выбираю инструмент, исходя из задачи. Практикую минималистичный подход при выборе стека технологий.</p>
      <p>На данный момент занимаюсь веб-разработкой порядка <strong>{experience} лет</strong>. За это время было реализовано более <strong>130 проектов</strong> разной сложности (как индивидуальных, так и в составе команды).</p>
      <p>В 2010 году я начал свою деятельность как <strong>веб-дизайнер</strong>. В течение следующего года обучился вёрстке и освоил <strong>JavaScript</strong> и <strong>Frontend разработку</strong>. После чего углублял знание в <strong>backend-разработке</strong> (Node.js, PHP, Ruby on Rails).</p>
      <p>Большую часть своей профессиональной деятельности работаю как фрилансер и вольный консультант, а также сотрудничаю с компаниями из Беларуси, России, Литвы, Польши и Испании.</p>
      <ul>
        <li>Для решения большинства задач предпочитаю использовать связку <strong>Evolution CMF + Vanilla JavaScript</strong>.</li>
        <li>Для лёгких приложений и сайтов - <strong>SvelteKit</strong> или <strong>Next.js</strong>.</li>
        <li>Для решения задач, со сложной бизнес-логикой, реализую RestAPI на <strong>Ruby on Rails</strong>.</li>
      </ul>
    </div>
    <hr />
    <div class="row full">
      <h3 class="narrow">Стек технологий:</h3>
      <table>
        <tr>
          <td>
            <h5 class="narrow"><img src="/images/tech/node.svg" alt="Node.js" />&nbsp;Node.js</h5>
            <ul>
              <li>Svelte / SvelteKit</li>
              <li>React / Next.js</li>
              <li>Sails.js</li>
            </ul>
          </td>
          <td>
            <h5 class="narrow"><img src="/images/tech/php.svg" alt="PHP" />&nbsp;PHP</h5>
            <ul>
              <li>Laravel / Evolution CMF</li>
              <li>CodeIgniter</li>
            </ul>
          </td>
          <td>
            <h5 class="narrow"><img src="/images/tech/ruby.svg" alt="Ruby" />&nbsp;Ruby</h5>
            <ul>
              <li>Ruby on Rails</li>
            </ul>
          </td>
        </tr>
        <tr>
          <td>
            <h5 class="narrow"><img src="/images/tech/db.svg" alt="DB" />&nbsp;SQL &#8226; NOSQL</h5>
            <ul>
              <li>MySQL</li>
              <li>PostgreSQL</li>
              <li>MongoDB</li>
            </ul>
          </td>
          <td>
            <h5 class="narrow"><img src="/images/tech/ui.svg" alt="UIUX" />&nbsp;UX &#8226; UI</h5>
            <ul>
              <li>Lunacy</li>
              <li>Inkscape</li>
              <li>GIMP</li>
            </ul>
          </td>
          <td>
            <h5 class="narrow"><img src="/images/tech/misc.svg" alt="Разное" />&nbsp;Остальное</h5>
            <ul>
              <li>RestAPI</li>
              <li>Git</li>
              <li>Docker</li>
              <li>ISO / IEC 9001</li>
              <li>SCRUM / AGILE</li>
              <li>Mobile Frirst</li>
            </ul>
          </td>
        </tr>
      </table>
    </div>
  </CV>
</Content>
<Composition {status} />

<style>
strong.hight {
  font-size: 120%;
}
.cv-photo {
  position: absolute;
  right: 0;
  top: 0;
}
.cv-photo > img {
  display: block;
}
.button > img {
  vertical-align: middle;
  margin: 0 5px 4px 0;
}
.row {
  position: relative;
  display: inline-block;
  vertical-align: top;
  width: 50%;
  padding: 20px 40px;
}
.row + hr {
  margin: 0;
}
.row.full {
  width: 100%;
}
.row h5 img {
  vertical-align: middle;
  margin-right: 3px;
  margin-top: -6px;
  height: 28px;
  width: auto;
}
table {
  width: 100%;
}
table tr {
  background: none;
}
table td {
  vertical-align: top;
  width: calc(100% / 6);
  border: none;
}
table ul {
  display: inline-block;
  vertical-align: top;
}
table ul li::marker {
  color: #777;
}
table h5 {
  width: fit-content;
  padding: 0 10px;
  background: #00000010;
  line-height: 40px;
  font-weight: bold;
  border-radius: 4px;
}
</style>